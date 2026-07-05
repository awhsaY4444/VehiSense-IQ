from __future__ import annotations

import zipfile
from urllib.request import urlretrieve

import pandas as pd

from ml.config import AI4I_URLS, CMAPSS_URLS, RAW_DATA_DIR


def ensure_dirs() -> None:
    RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)


def move_if_needed(extracted, target_path) -> None:
    if extracted.resolve() != target_path.resolve():
        extracted.replace(target_path)


def load_ai4i() -> pd.DataFrame:
    ensure_dirs()
    csv_path = RAW_DATA_DIR / "ai4i2020.csv"
    if csv_path.exists():
        return pd.read_csv(csv_path)
    errors: list[str] = []
    for url in AI4I_URLS:
        try:
            if url.endswith(".zip"):
                zip_path = RAW_DATA_DIR / "ai4i.zip"
                urlretrieve(url, zip_path)
                with zipfile.ZipFile(zip_path) as archive:
                    member = next(name for name in archive.namelist() if name.lower().endswith(".csv"))
                    archive.extract(member, RAW_DATA_DIR)
                    move_if_needed(RAW_DATA_DIR / member, csv_path)
            else:
                urlretrieve(url, csv_path)
            return pd.read_csv(csv_path)
        except Exception as exc:
            errors.append(f"{url}: {exc}")
    raise RuntimeError("Unable to download AI4I dataset. " + " | ".join(errors))


def _extract_train_fd001(zip_path, target_path) -> bool:
    with zipfile.ZipFile(zip_path) as archive:
        names = archive.namelist()
        direct = [name for name in names if name.endswith("train_FD001.txt")]
        if direct:
            archive.extract(direct[0], RAW_DATA_DIR)
            move_if_needed(RAW_DATA_DIR / direct[0], target_path)
            return True
        nested = [name for name in names if name.endswith("CMAPSSData.zip")]
        if nested:
            archive.extract(nested[0], RAW_DATA_DIR)
            nested_path = RAW_DATA_DIR / nested[0]
            with zipfile.ZipFile(nested_path) as nested_archive:
                member = next(name for name in nested_archive.namelist() if name.endswith("train_FD001.txt"))
                nested_archive.extract(member, RAW_DATA_DIR)
                move_if_needed(RAW_DATA_DIR / member, target_path)
            return True
    return False


def load_cmapss() -> pd.DataFrame:
    ensure_dirs()
    txt_path = RAW_DATA_DIR / "train_FD001.txt"
    if txt_path.exists():
        return pd.read_csv(txt_path, sep=r"\s+", header=None)
    errors: list[str] = []
    for url in CMAPSS_URLS:
        try:
            if url.endswith(".zip") or "application%2Fzip" in url or "Turbofan" in url:
                zip_path = RAW_DATA_DIR / "cmapss.zip"
                if not zip_path.exists():
                    urlretrieve(url, zip_path)
                if not _extract_train_fd001(zip_path, txt_path):
                    raise RuntimeError("train_FD001.txt not found in archive")
            else:
                urlretrieve(url, txt_path)
            return pd.read_csv(txt_path, sep=r"\s+", header=None)
        except Exception as exc:
            errors.append(f"{url}: {exc}")
    raise RuntimeError("Unable to download NASA CMAPSS FD001 dataset. " + " | ".join(errors))
