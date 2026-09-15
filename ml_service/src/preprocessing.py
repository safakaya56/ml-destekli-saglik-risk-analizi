"""
NHANES 2017-2018 Data Preprocessing & Target Construction Module.
Extracts clinical feature matrices and ground-truth disease targets.
"""

import os
import json
import pandas as pd
import numpy as np

# Feature Column Mapping
FEATURE_MAPPING = {
    "RIDAGEYR": "age",
    "RIAGENDR": "gender",  # 1: Male -> 1, 2: Female -> 0
    "BMXBMI": "bmi",
    "BMXHT": "height",
    "BMXWT": "weight",
    "BPXSY1": "systolic_bp",
    "BPXDI1": "diastolic_bp",
    "LBXGLU": "glucose",
    "LBXGH": "hba1c",
    "LBXTC": "total_cholesterol",
    "LBDHDD": "hdl",
    "LBXTR": "triglycerides",
    "LBDLDLM": "ldl",
    "LBXSCR": "creatinine",
    "LBXSBU": "bun",
}

# Targeted questionnaire items (strictly excluded from X)
TARGET_COLS = ["DIQ010", "MCQ160B", "MCQ160C", "MCQ160D", "MCQ160E", "MCQ160F", "KIQ022", "KIQ025"]


def construct_targets(df: pd.DataFrame) -> pd.DataFrame:
    """Constructs binary ground-truth target variables."""
    targets = pd.DataFrame(index=df.index)

    # 1. Diabetes Target
    # 1 = Doctor diagnosed diabetes, 2 = No
    targets["target_diabetes"] = np.nan
    targets.loc[df["DIQ010"] == 1, "target_diabetes"] = 1.0
    targets.loc[df["DIQ010"] == 2, "target_diabetes"] = 0.0

    # 2. Cardiovascular Disease Target
    # 1 if participant has any of CHF (160B), CHD (160C), Angina (160D), Heart Attack (160E), Stroke (160F)
    cvd_cols = ["MCQ160B", "MCQ160C", "MCQ160D", "MCQ160E", "MCQ160F"]
    has_cvd = (df[cvd_cols] == 1).any(axis=1)
    has_no_cvd = (df[cvd_cols] == 2).all(axis=1)

    targets["target_cvd"] = np.nan
    targets.loc[has_cvd, "target_cvd"] = 1.0
    targets.loc[has_no_cvd, "target_cvd"] = 0.0

    # 3. Kidney Disease Target
    # 1 if told weak/failing kidneys (KIQ022 == 1) or dialysis (KIQ025 == 1)
    has_kidney = (df["KIQ022"] == 1) | (df["KIQ025"] == 1)
    has_no_kidney = (df["KIQ022"] == 2) & ((df["KIQ025"] == 2) | (df["KIQ025"].isna()))

    targets["target_kidney"] = np.nan
    targets.loc[has_kidney, "target_kidney"] = 1.0
    targets.loc[has_no_kidney, "target_kidney"] = 0.0

    return targets


def preprocess_nhanes(raw_csv_path: str, output_dir: str = "ml_service/data/processed") -> str:
    """Preprocesses raw NHANES merged data and exports cleaned dataset."""
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"Loading raw dataset from {raw_csv_path}...")
    df = pd.read_csv(raw_csv_path, low_memory=False)

    # 1. Feature Extraction
    features = pd.DataFrame()
    for orig_col, new_col in FEATURE_MAPPING.items():
        if orig_col in df.columns:
            features[new_col] = df[orig_col]

    # Convert gender: 1 (Male) -> 1, 2 (Female) -> 0
    if "gender" in features.columns:
        features["gender"] = features["gender"].map({1.0: 1, 2.0: 0})

    # Clean biological extreme outliers / invalid negative values
    numeric_cols = [c for c in features.columns if c != "gender"]
    for col in numeric_cols:
        features.loc[features[col] <= 0, col] = np.nan

    # Routine Anamnesis Features (Zero Data Leakage Risk)
    # Smoking: 1 if smoked 100+ cigarettes, else 0
    if "SMQ020" in df.columns:
        features["smoking"] = (df["SMQ020"] == 1).astype(int)
    else:
        features["smoking"] = 0

    # Family History of Diabetes (MCQ300A == 1)
    if "MCQ300A" in df.columns:
        features["family_history_diabetes"] = (df["MCQ300A"] == 1).astype(int)
    else:
        features["family_history_diabetes"] = 0

    # Family History of CVD (Heart Attack MCQ300C == 1 or Stroke MCQ300B == 1)
    mcq_cvd = False
    if "MCQ300C" in df.columns:
        mcq_cvd = mcq_cvd | (df["MCQ300C"] == 1)
    if "MCQ300B" in df.columns:
        mcq_cvd = mcq_cvd | (df["MCQ300B"] == 1)
    features["family_history_cvd"] = mcq_cvd.astype(int)

    # 2. Target Extraction
    targets = construct_targets(df)

    # 3. Combine Features & Targets
    processed_df = pd.concat([features, targets], axis=1)

    output_path = os.path.join(output_dir, "nhanes_cleaned.csv")
    processed_df.to_csv(output_path, index=False)

    # Export Feature List Metadata
    feature_names = list(features.columns)
    for target in ["diabetes", "cvd", "kidney"]:
        meta_path = os.path.join(output_dir, f"features_used_{target}.json")
        with open(meta_path, "w") as f:
            json.dump({"features": feature_names, "target": f"target_{target}"}, f, indent=2)

    print(f"Cleaned dataset saved to {output_path} with shape {processed_df.shape}")
    print(f"Diabetes positives: {targets['target_diabetes'].sum()} / {targets['target_diabetes'].count()}")
    print(f"CVD positives: {targets['target_cvd'].sum()} / {targets['target_cvd'].count()}")
    print(f"Kidney positives: {targets['target_kidney'].sum()} / {targets['target_kidney'].count()}")

    return output_path


if __name__ == "__main__":
    preprocess_nhanes("ml_service/data/raw/nhanes_2017_2018_merged.csv")
