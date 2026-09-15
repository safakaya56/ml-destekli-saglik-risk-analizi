"""
FastAPI Server for Health Risk Assessment ML Service.
Serves multi-model risk inference, SHAP feature attributions, and Gemini summaries.
"""

import os
import pickle
from datetime import datetime, timezone
from typing import Optional, Dict, Any

import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.explain import ModelExplainer, FEATURE_COLS
from src.gemini_summary import generate_clinical_summary

app = FastAPI(
    title="Health Risk Assessment ML Service",
    description="Multi-target risk assessment (Diabetes, CVD, Kidney) with SHAP explainability and Gemini LLM synthesis.",
    version="1.0.0"
)

# Global Model & Explainer Containers
MODELS: Dict[str, Any] = {}
EXPLAINERS: Dict[str, ModelExplainer] = {}

TARGET_MAP = {
    "diabetes": "diabetes_model_v1.pkl",
    "cardiovascular": "cvd_model_v1.pkl",
    "kidney": "kidney_model_v1.pkl"
}


class PatientLabInput(BaseModel):
    patient_id: Optional[str] = "P-DEMO"
    age: float = Field(..., ge=1, le=120, description="Age in years")
    gender: int = Field(..., ge=0, le=1, description="Gender: 1 for Male, 0 for Female")
    bmi: float = Field(..., ge=10, le=70, description="BMI in kg/m2")
    height: Optional[float] = 175.0
    weight: Optional[float] = 75.0
    systolic_bp: float = Field(..., ge=70, le=250, description="Systolic Blood Pressure (mmHg)")
    diastolic_bp: float = Field(..., ge=40, le=150, description="Diastolic Blood Pressure (mmHg)")
    glucose: float = Field(..., ge=40, le=500, description="Fasting Glucose (mg/dL)")
    hba1c: float = Field(..., ge=3.0, le=18.0, description="HbA1c (%)")
    total_cholesterol: float = Field(..., ge=80, le=500, description="Total Cholesterol (mg/dL)")
    hdl: float = Field(..., ge=10, le=150, description="HDL Cholesterol (mg/dL)")
    triglycerides: float = Field(..., ge=30, le=1000, description="Triglycerides (mg/dL)")
    ldl: float = Field(..., ge=20, le=400, description="LDL Cholesterol (mg/dL)")
    creatinine: float = Field(..., ge=0.2, le=15.0, description="Serum Creatinine (mg/dL)")
    bun: float = Field(..., ge=2.0, le=100.0, description="Blood Urea Nitrogen (mg/dL)")
    smoking: int = Field(0, ge=0, le=1, description="Smoking Status (1: Active/Former, 0: Never)")
    family_history_diabetes: int = Field(0, ge=0, le=1, description="Family History of Diabetes (1: Yes, 0: No)")
    family_history_cvd: int = Field(0, ge=0, le=1, description="Family History of Heart Attack/Stroke (1: Yes, 0: No)")


@app.on_event("startup")
def load_models_on_startup():
    """Loads all trained model pipelines and SHAP explainers on app startup."""
    models_dir = os.path.join(os.path.dirname(__file__), "models")
    for key, filename in TARGET_MAP.items():
        model_path = os.path.join(models_dir, filename)
        if os.path.exists(model_path):
            print(f"Loading {key} model from {model_path}...")
            with open(model_path, "rb") as f:
                MODELS[key] = pickle.load(f)
            EXPLAINERS[key] = ModelExplainer(model_path)
            print(f"Loaded {key} model and SHAP explainer successfully.")
        else:
            print(f"WARNING: Model file {model_path} not found.")


@app.get("/health")
def health_check():
    """Health check endpoint returning loaded model status."""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "loaded_models": list(MODELS.keys())
    }


def calculate_clinical_hybrid_risk(target: str, raw_prob: float, lab: PatientLabInput) -> tuple:
    """
    Clinical Hybrid Decision Engine:
    Combines ML calibrated probability with medical guidelines (ADA, ACC/AHA, KDIGO).
    Ensures abnormal biomarker thresholds (e.g. Creatinine > 1.4, BP > 140, HbA1c > 6.5)
    are accurately represented as High Risk in decision support output.
    """
    prob = raw_prob

    if target == "diabetes":
        # ADA Guidelines: HbA1c >= 6.5 or Fasting Glucose >= 126 mg/dL -> Diabetes Range
        if lab.hba1c >= 6.5 or lab.glucose >= 126:
            prob = max(prob, 0.72 + (lab.hba1c - 6.5) * 0.05)
        elif lab.hba1c >= 5.7 or lab.glucose >= 100:
            prob = max(prob, 0.38 + (lab.hba1c - 5.7) * 0.1)

    elif target == "cardiovascular":
        # ACC/AHA Guidelines: Systolic BP >= 140 or Diastolic BP >= 90 or Total Chol >= 240
        if lab.systolic_bp >= 140 or lab.diastolic_bp >= 90 or lab.total_cholesterol >= 240:
            bp_factor = (lab.systolic_bp - 140) * 0.005
            prob = max(prob, 0.65 + bp_factor)
        elif lab.systolic_bp >= 130 or lab.diastolic_bp >= 80 or lab.total_cholesterol >= 200:
            prob = max(prob, 0.35)

    elif target == "kidney":
        # KDIGO Guidelines: Serum Creatinine >= 1.3 mg/dL or BUN >= 24 mg/dL -> Impaired Renal Function
        if lab.creatinine >= 1.3 or lab.bun >= 24:
            cr_factor = (lab.creatinine - 1.3) * 0.2
            prob = max(prob, 0.68 + cr_factor)
        elif lab.creatinine >= 1.1 or lab.bun >= 20:
            prob = max(prob, 0.35)

    # Bound probability between 0.02 and 0.98
    prob = min(0.98, max(0.02, prob))

    if prob >= 0.55:
        risk_label = "Yüksek Risk"
        pred_class = 1
    elif prob >= 0.25:
        risk_label = "Orta Risk"
        pred_class = 0
    else:
        risk_label = "Düşük Risk"
        pred_class = 0

    return round(prob, 4), pred_class, risk_label


@app.post("/api/v1/predict")
def predict_health_risks(lab: PatientLabInput):
    """
    Executes full multi-target health risk assessment:
    1. ML Inference + Clinical Hybrid Decision Engine
    2. SHAP Top Contributing Factors per target
    3. Gemini LLM Clinical Synthesis
    """
    if not MODELS:
        raise HTTPException(status_code=500, detail="Models not loaded. Train models first.")

    patient_dict = lab.model_dump()
    
    predictions = {}
    shap_explanations = {}

    for key in TARGET_MAP.keys():
        if key not in MODELS:
            continue

        model = MODELS[key]
        explainer = EXPLAINERS[key]

        df_input = pd.DataFrame([patient_dict])[FEATURE_COLS]
        raw_prob = float(model.predict_proba(df_input)[:, 1][0])

        # Apply Clinical Hybrid Decision Engine
        prob, pred_class, risk_label = calculate_clinical_hybrid_risk(key, raw_prob, lab)

        predictions[key] = {
            "target": key,
            "predicted_class": pred_class,
            "risk_label": risk_label,
            "probability": prob,
            "model_version": f"{key}-v1"
        }

        # Calculate SHAP factors
        shap_res = explainer.explain_patient(patient_dict, top_k=4)
        shap_explanations[key] = shap_res["top_factors"]

    # Generate Gemini Clinical Summary
    llm_summary = generate_clinical_summary(
        patient_info={
            "age": lab.age,
            "gender": "Erkek" if lab.gender == 1 else "Kadın",
            "bmi": lab.bmi,
            "glucose": lab.glucose,
            "hba1c": lab.hba1c,
            "systolic_bp": lab.systolic_bp,
            "diastolic_bp": lab.diastolic_bp,
            "total_cholesterol": lab.total_cholesterol,
            "creatinine": lab.creatinine,
            "bun": lab.bun,
            "smoking": "Evet" if lab.smoking == 1 else "Hayır",
            "family_history_diabetes": "Var" if lab.family_history_diabetes == 1 else "Yok",
            "family_history_cvd": "Var" if lab.family_history_cvd == 1 else "Yok"
        },
        predictions=predictions,
        shap_explanations=shap_explanations
    )

    return {
        "patient_id": lab.patient_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "predictions": predictions,
        "shap_explanations": shap_explanations,
        "llm_summary": llm_summary
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
