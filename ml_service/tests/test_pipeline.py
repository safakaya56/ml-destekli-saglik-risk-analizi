"""
Unit & Integration Tests for ML Service.
Verifies data leakage prevention, model loading, predictions, and SHAP outputs.
"""

import os
import json
import pytest
import pandas as pd
from fastapi.testclient import TestClient

from main import app, load_models_on_startup

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_models():
    load_models_on_startup()


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "diabetes" in data["loaded_models"]


def test_leakage_prevention():
    """Verifies target variables are not in feature metadata."""
    feature_meta_path = "ml_service/data/processed/features_used_diabetes.json"
    if os.path.exists(feature_meta_path):
        with open(feature_meta_path, "r") as f:
            meta = json.load(f)
            features = meta["features"]
            # Assert target variables are strictly excluded
            assert "DIQ010" not in features
            assert "MCQ160B" not in features
            assert "KIQ022" not in features


def test_predict_endpoint():
    """Test full patient risk assessment endpoint."""
    payload = {
        "patient_id": "P-TEST-01",
        "age": 55,
        "gender": 1,
        "bmi": 28.5,
        "height": 178,
        "weight": 90,
        "systolic_bp": 135,
        "diastolic_bp": 85,
        "glucose": 140,
        "hba1c": 6.8,
        "total_cholesterol": 220,
        "hdl": 42,
        "triglycerides": 180,
        "ldl": 142,
        "creatinine": 1.1,
        "bun": 18
    }

    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "predictions" in data
    assert "diabetes" in data["predictions"]
    assert "cardiovascular" in data["predictions"]
    assert "kidney" in data["predictions"]

    # Check probabilities are between 0 and 1
    for key, pred in data["predictions"].items():
        assert 0.0 <= pred["probability"] <= 1.0
        assert pred["risk_label"] in ["Düşük Risk", "Orta Risk", "Yüksek Risk"]

    # Check SHAP explanations
    assert "shap_explanations" in data
    assert len(data["shap_explanations"]["diabetes"]) > 0

    # Check LLM summary structure
    assert "llm_summary" in data
    assert "summary" in data["llm_summary"]
    assert "disclaimer" in data["llm_summary"]
