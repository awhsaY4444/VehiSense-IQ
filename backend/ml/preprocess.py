from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np
import pandas as pd

from app.data import get_vehicle
from app.schemas import SensorPayload
from ml.config import AI4I_FEATURES, RUL_FEATURES

TYPE_MAP = {"L": 0, "M": 1, "H": 2}


def normalize_ai4i_columns(df: pd.DataFrame) -> pd.DataFrame:
    frame = df.copy()
    frame.columns = [str(col).strip().lower().replace("[", "").replace("]", "").replace(" ", "_") for col in frame.columns]
    rename = {
        "air_temperature_k": "air_temperature_k",
        "process_temperature_k": "process_temperature_k",
        "rotational_speed_rpm": "rotational_speed_rpm",
        "torque_nm": "torque_nm",
        "tool_wear_min": "tool_wear_min",
        "machine_failure": "target",
    }
    frame = frame.rename(columns=rename)
    if "type" in frame.columns:
        frame["type_code"] = frame["type"].map(TYPE_MAP).fillna(1).astype(float)
    if "engine_vibration" not in frame.columns:
        rpm_z = (frame["rotational_speed_rpm"] - frame["rotational_speed_rpm"].mean()) / frame["rotational_speed_rpm"].std()
        torque_z = (frame["torque_nm"] - frame["torque_nm"].mean()) / frame["torque_nm"].std()
        frame["engine_vibration"] = (np.abs(rpm_z) * 0.55 + np.abs(torque_z) * 0.45 + np.random.default_rng(42).normal(0, 0.03, len(frame))).clip(0, 3)
    return frame


def ai4i_training_matrix(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    frame = normalize_ai4i_columns(df)
    missing = [feature for feature in AI4I_FEATURES + ["target"] if feature not in frame.columns]
    if missing:
        raise ValueError(f"AI4I dataset missing required columns: {missing}")
    return frame[AI4I_FEATURES].astype(float), frame["target"].astype(int)


def normalize_cmapss_frame(raw: pd.DataFrame) -> pd.DataFrame:
    columns = ["unit", "cycle", "setting_1", "setting_2", "setting_3"] + [f"sensor_{idx}" for idx in range(1, 22)]
    frame = raw.iloc[:, : len(columns)].copy()
    frame.columns = columns
    max_cycle = frame.groupby("unit")["cycle"].transform("max")
    frame["rul"] = max_cycle - frame["cycle"]
    return frame


def cmapss_training_matrix(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    frame = normalize_cmapss_frame(df)
    return frame[RUL_FEATURES].astype(float), frame["rul"].astype(float)


def sensor_payload_for_vehicle(vehicle_id: str, override: SensorPayload | None = None) -> dict[str, float]:
    vehicle = get_vehicle(vehicle_id)
    stress = min(1.0, max(0.05, vehicle.mileageKm / 360000))
    route_load = 1.15 if vehicle.revenuePerDay >= 50000 else 0.95 if vehicle.revenuePerDay <= 40000 else 1.0
    base = {
        "type_code": 2.0 if "Prima" in vehicle.model or "Signa" in vehicle.model else 1.0,
        "air_temperature_k": 298.0 + stress * 7.0,
        "process_temperature_k": 308.0 + stress * 10.0,
        "rotational_speed_rpm": 1820.0 - stress * 280.0,
        "torque_nm": 36.0 + stress * 25.0 * route_load,
        "tool_wear_min": min(250.0, 35.0 + stress * 210.0),
        "engine_vibration": 0.35 + stress * 1.85,
    }
    if override:
        mapping = override.model_dump(exclude_none=True)
        aliases = {
            "air_temperature_k": "air_temperature_k",
            "process_temperature_k": "process_temperature_k",
            "rotational_speed_rpm": "rotational_speed_rpm",
            "torque_nm": "torque_nm",
            "tool_wear_min": "tool_wear_min",
            "engine_vibration": "engine_vibration",
        }
        for key, value in mapping.items():
            if key in aliases and value is not None:
                base[aliases[key]] = float(value)
    return base


def rul_payload_for_vehicle(vehicle_id: str, failure_probability: float) -> dict[str, float]:
    vehicle = get_vehicle(vehicle_id)
    stress = min(1.0, max(0.05, vehicle.mileageKm / 360000))
    cycle = min(310.0, max(5.0, vehicle.engineHours / 42.0))
    return {
        "cycle": cycle,
        "setting_1": -0.0007 + stress * 0.0014,
        "setting_2": 0.0002 + stress * 0.0005,
        "setting_3": 100.0,
        "sensor_2": 641.0 + stress * 3.5,
        "sensor_3": 1582.0 + stress * 28.0,
        "sensor_4": 1395.0 + stress * 45.0,
        "sensor_7": 554.0 - stress * 3.2,
        "sensor_8": 2388.0,
        "sensor_9": 9050.0 + stress * 180.0,
        "sensor_11": 47.0 + stress * 1.5,
        "sensor_12": 522.0 - stress * 4.8,
        "sensor_13": 2388.0,
        "sensor_14": 8130.0 + stress * 130.0,
        "sensor_15": 8.42 + stress * 0.09,
        "sensor_17": 392.0 + stress * 6.0,
        "sensor_20": 39.0 - stress * 1.2,
        "sensor_21": 23.35 - stress * 0.8,
    }


def feature_frame(values: dict[str, float], features: list[str]) -> pd.DataFrame:
    return pd.DataFrame([{feature: float(values[feature]) for feature in features}])


def confidence_from_probability(probability: float) -> float:
    return float(max(0.55, min(0.98, 0.5 + abs(probability - 0.5) * 0.96)))
