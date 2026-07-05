from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np
from sklearn.metrics import accuracy_score, roc_auc_score
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

from ml.config import FAILURE_MODEL_PATH, MODELS_DIR
from ml.datasets import load_ai4i
from ml.feature_engineering import add_ai4i_interactions
from ml.preprocess import ai4i_training_matrix


def train() -> dict[str, float]:
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    data = load_ai4i()
    x_raw, y = ai4i_training_matrix(data)
    x = add_ai4i_interactions(x_raw)
    x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.2, random_state=42, stratify=y)
    scale_pos_weight = max(1.0, float((y_train == 0).sum() / max(1, (y_train == 1).sum())))
    model = XGBClassifier(
        n_estimators=240,
        max_depth=4,
        learning_rate=0.045,
        subsample=0.9,
        colsample_bytree=0.9,
        objective="binary:logistic",
        eval_metric="logloss",
        scale_pos_weight=scale_pos_weight,
        random_state=42,
    )
    model.fit(x_train, y_train)
    probabilities = model.predict_proba(x_test)[:, 1]
    predictions = (probabilities >= 0.5).astype(int)
    metrics = {
        "accuracy": float(accuracy_score(y_test, predictions)),
        "roc_auc": float(roc_auc_score(y_test, probabilities)),
        "rows": float(len(x)),
        "features": float(len(x.columns)),
    }
    artifact = {
        "model": model,
        "features": list(x.columns),
        "metrics": metrics,
        "dataset": "AI4I 2020 Predictive Maintenance Dataset",
    }
    joblib.dump(artifact, FAILURE_MODEL_PATH)
    (MODELS_DIR / "failure_metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    return metrics


if __name__ == "__main__":
    print(json.dumps(train(), indent=2))
