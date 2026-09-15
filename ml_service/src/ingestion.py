"""
NHANES 2017-2018 Data Ingestion Module.
Downloads CDC XPT files using exact public repository URLs and merges them on SEQN.
"""

import os
import requests
import pandas as pd

BASE_URL = "https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2017/DataFiles/"

FILES = {
    "demo": "DEMO_J.xpt",
    "bmx": "BMX_J.xpt",
    "bpx": "BPX_J.xpt",
    "glu": "GLU_J.xpt",
    "ghb": "GHB_J.xpt",
    "tchol": "TCHOL_J.xpt",
    "hdl": "HDL_J.xpt",
    "trigly": "TRIGLY_J.xpt",
    "biopro": "BIOPRO_J.xpt",
    "diq": "DIQ_J.xpt",
    "mcq": "MCQ_J.xpt",
    "kiq": "KIQ_U_J.xpt",
    "smq": "SMQ_J.xpt"
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}


def download_nhanes_files(raw_dir: str) -> None:
    """Downloads missing NHANES 2017-2018 XPT files into raw_dir using exact CDC paths."""
    os.makedirs(raw_dir, exist_ok=True)
    for key, filename in FILES.items():
        file_path = os.path.join(raw_dir, filename)
        url = BASE_URL + filename
        print(f"Downloading {filename} from {url}...")
        resp = requests.get(url, headers=HEADERS, stream=True)
        resp.raise_for_status()
        with open(file_path, "wb") as f:
            for chunk in resp.iter_content(chunk_size=8192):
                f.write(chunk)
        print(f"Saved {filename} ({os.path.getsize(file_path)} bytes)")


def merge_nhanes_data(raw_dir: str) -> pd.DataFrame:
    """Reads XPT files and merges them sequentially on SEQN."""
    dataframes = []
    
    for key, filename in FILES.items():
        file_path = os.path.join(raw_dir, filename)
        print(f"Reading {filename}...")
        try:
            df = pd.read_sas(file_path, format="xport")
        except Exception:
            import pyreadstat
            df, _ = pyreadstat.read_xport(file_path)
            
        df["SEQN"] = df["SEQN"].astype(int)
        dataframes.append((key, df))

    # Start with Demographics dataframe
    merged_df = dataframes[0][1]
    print(f"Initial Demographics row count: {len(merged_df)}")

    for key, df in dataframes[1:]:
        before_count = len(merged_df)
        merged_df = pd.merge(merged_df, df, on="SEQN", how="left")
        after_count = len(merged_df)
        print(f"Merged {key}: before={before_count}, after={after_count}")

    return merged_df


def run_ingestion(raw_dir: str = "ml_service/data/raw") -> str:
    """Executes download, merge, and saves merged CSV."""
    download_nhanes_files(raw_dir)
    merged_df = merge_nhanes_data(raw_dir)
    
    output_csv = os.path.join(raw_dir, "nhanes_2017_2018_merged.csv")
    merged_df.to_csv(output_csv, index=False)
    print(f"Merged NHANES dataset saved to {output_csv} with shape {merged_df.shape}")
    return output_csv


if __name__ == "__main__":
    run_ingestion()
