from __future__ import annotations

import numpy as np
import pandas as pd


def add_ai4i_interactions(features: pd.DataFrame) -> pd.DataFrame:
    frame = features.copy()
    frame["thermal_delta"] = frame["process_temperature_k"] - frame["air_temperature_k"]
    frame["mechanical_power_proxy"] = frame["rotational_speed_rpm"] * frame["torque_nm"] / 9550.0
    frame["wear_torque_index"] = frame["tool_wear_min"] * frame["torque_nm"] / 100.0
    frame["vibration_load_index"] = frame["engine_vibration"] * np.maximum(frame["torque_nm"], 1.0)
    return frame


def add_rul_interactions(features: pd.DataFrame) -> pd.DataFrame:
    frame = features.copy()
    frame["temperature_margin"] = frame["sensor_4"] - frame["sensor_3"]
    frame["efficiency_proxy"] = frame["sensor_20"] / np.maximum(frame["sensor_11"], 1.0)
    frame["degradation_index"] = frame["cycle"] * (frame["sensor_15"] / 8.4)
    return frame
