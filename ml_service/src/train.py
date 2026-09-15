"""
NHANES Multi-Target Machine Learning Model Training Module.
Trains, calibrates, and evaluates Diabetes, CVD, and Kidney classifiers
using scientifically rigorous class-imbalance weighting.
"""

import os
import json
import pickle
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_validate
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.calibration import CalibratedClassifierCV
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import (
    roc_auc_score,
    average_precision_score,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
)

TARGETS = ["diabetes", "cvd", "kidney"]
FEATURE_COLS = [
    "age", "gender", "bmi", "height", "weight",
    "systolic_bp", "diastolic_bp", "glucose", "hba1c",
    "total_cholesterol", "hdl", "triglycerides", "ldl",
    "creatinine", "bun", "smoking", "family_history_diabetes", "family_history_cvd"
]


def create_base_pipeline(model):
    """Creates a scikit-learn Pipeline with train-scoped Imputer, Scaler, and Estimator."""
    return Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
        ("classifier", model)
    ])


def evaluate_model_on_test(pipeline, X_test, y_test):
    """Calculates evaluation metrics on holdout test set."""
    y_pred = pipeline.predict(X_test)
    y_prob = pipeline.predict_proba(X_test)[:, 1]

    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = cm.ravel()

    return {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred, zero_division=0)),
        "recall_sensitivity": float(recall_score(y_test, y_pred, zero_division=0)),
        "specificity": float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0,
        "f1_score": float(f1_score(y_test, y_pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_test, y_prob)),
        "pr_auc": float(average_precision_score(y_test, y_prob)),
        "confusion_matrix": cm.tolist()
    }


def train_target_models(df: pd.DataFrame, target_name: str, models_dir: str, reports_dir: str):
    """Trains and evaluates candidate models for a specific target with scientific class balancing."""
    target_col = f"target_{target_name}"
    
    # Filter valid target rows
    data = df.dropna(subset=[target_col]).copy()
    X = data[FEATURE_COLS]
    y = data[target_col].astype(int)

    print(f"\n==========================================")
    print(f" Training Scientific ML Models for Target: {target_name.upper()}")
    print(f" Valid Samples: {len(data)} | Positives: {y.sum()} ({y.mean()*100:.2f}%)")
    print(f"==========================================")

    # 80/20 Stratified Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    # Calculate class imbalance ratio
    pos_count = y_train.sum()
    neg_count = len(y_train) - pos_count
    scale_pos = neg_count / max(pos_count, 1)

    # Candidate Models with Scientific Class Imbalance Weighting
    candidates = {
        "logistic_regression": LogisticRegression(class_weight="balanced", max_iter=1000, random_state=42),
        "random_forest": RandomForestClassifier(class_weight="balanced", n_estimators=100, max_depth=6, random_state=42),
        "xgboost": XGBClassifier(
            n_estimators=150,
            max_depth=4,
            learning_rate=0.03,
            scale_pos_weight=scale_pos,
            eval_metric="logloss",
            random_state=42
        )
    }

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    best_candidate_name = None
    best_cv_auc = -1.0
    cv_results_summary = {}

    for name, model in candidates.items():
        pipe = create_base_pipeline(model)
        scoring = ["roc_auc", "average_precision", "recall", "precision"]
        scores = cross_validate(pipe, X_train, y_train, cv=cv, scoring=scoring)

        mean_auc = float(scores["test_roc_auc"].mean())
        mean_pr_auc = float(scores["test_average_precision"].mean())
        mean_recall = float(scores["test_recall"].mean())

        cv_results_summary[name] = {
            "cv_roc_auc_mean": mean_auc,
            "cv_roc_auc_std": float(scores["test_roc_auc"].std()),
            "cv_pr_auc_mean": mean_pr_auc,
            "cv_recall_mean": mean_recall,
        }

        print(f" Model [{name}]: CV ROC-AUC={mean_auc:.4f}, PR-AUC={mean_pr_auc:.4f}, Recall={mean_recall:.4f}")

        if mean_auc > best_cv_auc:
            best_cv_auc = mean_auc
            best_candidate_name = name

    print(f" Selected Best Model: {best_candidate_name} (CV ROC-AUC={best_cv_auc:.4f})")

    # Fit Best Candidate Pipeline
    best_model_inst = candidates[best_candidate_name]
    final_pipe = create_base_pipeline(best_model_inst)
    final_pipe.fit(X_train, y_train)

    # Final Holdout Test Evaluation
    test_metrics = evaluate_model_on_test(final_pipe, X_test, y_test)
    print(f" Test Set ROC-AUC: {test_metrics['roc_auc']:.4f} | PR-AUC: {test_metrics['pr_auc']:.4f} | Recall: {test_metrics['recall_sensitivity']:.4f}")

    # Save Model Artifacts
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(reports_dir, exist_ok=True)

    model_filename = f"{target_name}_model_v1.pkl"
    model_path = os.path.join(models_dir, model_filename)
    with open(model_path, "wb") as f:
        pickle.dump(final_pipe, f)

    # Save Report
    report = {
        "target": target_name,
        "model_version": f"{best_candidate_name}-v1",
        "sample_size": len(data),
        "positive_cases": int(y.sum()),
        "features": FEATURE_COLS,
        "cv_results": cv_results_summary,
        "best_model": best_candidate_name,
        "test_metrics": test_metrics
    }
    report_path = os.path.join(reports_dir, f"{target_name}_report.json")
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)

    print(f" Saved Model: {model_path}")
    print(f" Saved Report: {report_path}")


def run_training(
    cleaned_csv: str = "ml_service/data/processed/nhanes_cleaned.csv",
    models_dir: str = "ml_service/models",
    reports_dir: str = "ml_service/reports"
):
    """Runs training across all 3 health targets."""
    df = pd.read_csv(cleaned_csv)
    for target in TARGETS:
        train_target_models(df, target, models_dir, reports_dir)


if __name__ == "__main__":
    run_training()
