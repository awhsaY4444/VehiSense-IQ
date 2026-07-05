from __future__ import annotations

import json

import joblib
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from xgboost import XGBRegressor

from ml.config import MODELS_DIR, RUL_MODEL_PATH
from ml.datasets import load_cmapss
from ml.feature_engineering import add_rul_interactions
from ml.preprocess import cmapss_training_matrix


def train() -> dict[str, float]:
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    data = load_cmapss()
    x_raw, y = cmapss_training_matrix(data)
    x = add_rul_interactions(x_raw)
    x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.2, random_state=42)
    model = XGBRegressor(
        n_estimators=360,
        max_depth=5,
        learning_rate=0.035,
        subsample=0.9,
        colsample_bytree=0.9,
        objective="reg:squarederror",
        random_state=42,
    )
    model.fit(x_train, y_train)
    predictions = model.predict(x_test)
    metrics = {
        "mae": float(mean_absolute_error(y_test, predictions)),
        "r2": float(r2_score(y_test, predictions)),
        "rows": float(len(x)),
        "features": float(len(x.columns)),
    }
    artifact = {
        "model": model,
        "features": list(x.columns),
        "metrics": metrics,
        "dataset": "NASA CMAPSS FD001 Turbofan Engine Degradation Dataset",
    }
    joblib.dump(artifact, RUL_MODEL_PATH)
    (MODELS_DIR / "rul_metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    return metrics


if __name__ == "__main__":
    print(json.dumps(train(), indent=2))
