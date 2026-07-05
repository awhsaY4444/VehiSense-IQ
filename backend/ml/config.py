from __future__ import annotations

from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
RAW_DATA_DIR = BACKEND_DIR / "data" / "raw"
MODELS_DIR = BACKEND_DIR / "models"
FAILURE_MODEL_PATH = MODELS_DIR / "failure_model.pkl"
RUL_MODEL_PATH = MODELS_DIR / "rul_model.pkl"

AI4I_URLS = [
    "https://archive.ics.uci.edu/ml/machine-learning-databases/00601/ai4i2020.csv",
    "https://archive.ics.uci.edu/static/public/601/ai4i+2020+predictive+maintenance+dataset.zip",
]

CMAPSS_URLS = [
    "https://phm-datasets.s3.amazonaws.com/NASA/6.+Turbofan+Engine+Degradation+Simulation+Data+Set.zip",
    "https://github.com/anshumanv/C-MAPSS-Turbofan-Engine-Degradation/raw/master/CMAPSSData.zip",
    "https://raw.githubusercontent.com/kpeters/exploring-nasas-turbofan-dataset/master/CMAPSSData/train_FD001.txt",
]

AI4I_FEATURES = [
    "type_code",
    "air_temperature_k",
    "process_temperature_k",
    "rotational_speed_rpm",
    "torque_nm",
    "tool_wear_min",
    "engine_vibration",
]

RUL_FEATURES = [
    "cycle",
    "setting_1",
    "setting_2",
    "setting_3",
    "sensor_2",
    "sensor_3",
    "sensor_4",
    "sensor_7",
    "sensor_8",
    "sensor_9",
    "sensor_11",
    "sensor_12",
    "sensor_13",
    "sensor_14",
    "sensor_15",
    "sensor_17",
    "sensor_20",
    "sensor_21",
]

