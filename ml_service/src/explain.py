"""
SHAP Explainability Module.
Calculates local patient-level feature importance and risk factors.
"""

import pickle
import numpy as np
import pandas as pd
import shap

FEATURE_COLS = [
    "age", "gender", "bmi", "height", "weight",
    "systolic_bp", "diastolic_bp", "glucose", "hba1c",
    "total_cholesterol", "hdl", "triglycerides", "ldl",
    "creatinine", "bun", "smoking", "family_history_diabetes", "family_history_cvd"
]

FEATURE_LABELS = {
    "age": "Age",
    "gender": "Gender",
    "bmi": "BMI",
    "height": "Height",
    "weight": "Weight",
    "systolic_bp": "Systolic BP",
    "diastolic_bp": "Diastolic BP",
    "glucose": "Fasting Glucose",
    "hba1c": "HbA1c",
    "total_cholesterol": "Total Cholesterol",
    "hdl": "HDL Cholesterol",
    "triglycerides": "Triglycerides",
    "ldl": "LDL Cholesterol",
    "creatinine": "Serum Creatinine",
    "bun": "BUN",
    "smoking": "Smoking Status",
    "family_history_diabetes": "Family History of Diabetes",
    "family_history_cvd": "Family History of CVD"
}


class ModelExplainer:
    def __init__(self, model_path: str):
        with open(model_path, "rb") as f:
            self.calibrated_pipeline = pickle.load(f)
            
        # Extract base fitted estimator and steps
        if hasattr(self.calibrated_pipeline, "calibrated_classifiers_"):
            base_pipeline = self.calibrated_pipeline.calibrated_classifiers_[0].estimator
        else:
            base_pipeline = self.calibrated_pipeline

        self.imputer = base_pipeline.named_steps["imputer"]
        self.scaler = base_pipeline.named_steps["scaler"]
        self.classifier = base_pipeline.named_steps["classifier"]

        # Synthetic background dataset for SHAP masker
        background_sample = np.zeros((5, len(FEATURE_COLS)))
        try:
            if hasattr(self.classifier, "feature_importances_"):
                self.explainer = shap.TreeExplainer(self.classifier)
            elif hasattr(self.classifier, "coef_"):
                self.explainer = shap.LinearExplainer(self.classifier, background_sample)
            else:
                self.explainer = shap.Explainer(self.classifier.predict_proba, background_sample)
        except Exception:
            self.explainer = shap.Explainer(self.classifier.predict_proba, background_sample)

    def explain_patient(self, patient_dict: dict, top_k: int = 4) -> dict:
        """Calculates SHAP values for a single patient dictionary."""
        df = pd.DataFrame([patient_dict])[FEATURE_COLS]
        
        X_imputed = self.imputer.transform(df)
        X_scaled = self.scaler.transform(X_imputed)

        try:
            shap_values = self.explainer.shap_values(X_scaled)
        except Exception:
            sv_obj = self.explainer(X_scaled)
            shap_values = sv_obj.values

        # Format output array
        if isinstance(shap_values, list):
            sv = shap_values[1][0] if len(shap_values) > 1 else shap_values[0][0]
        elif len(shap_values.shape) == 3:
            sv = shap_values[0, :, 1]
        elif len(shap_values.shape) == 2:
            sv = shap_values[0]
        else:
            sv = shap_values

        features_impact = []
        for feat, val, impact in zip(FEATURE_COLS, df.iloc[0].values, sv):
            features_impact.append({
                "feature": feat,
                "label": FEATURE_LABELS.get(feat, feat),
                "value": float(val) if pd.notna(val) else None,
                "shap_impact": float(impact)
            })

        # Sort by absolute magnitude of SHAP contribution
        features_impact.sort(key=lambda x: abs(x["shap_impact"]), reverse=True)

        return {
            "top_factors": features_impact[:top_k],
            "all_factors": features_impact
        }
