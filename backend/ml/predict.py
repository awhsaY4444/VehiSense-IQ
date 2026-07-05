from __future__ import annotations

import time
from functools import cached_property
from typing import Any

import joblib
import numpy as np
import pandas as pd
import shap

from app.data import FLEET, get_vehicle
from app.repositories.persistence import repository
from app.schemas import EdgeInferenceResponse, ExplanationResponse, ForecastPoint, PredictionResponse, Priority, Recommendation, RulResponse, SensorPayload, ShapFeature
from app.services.telemetry_service import telemetry_service
from ml.config import AI4I_FEATURES, FAILURE_MODEL_PATH, RUL_FEATURES, RUL_MODEL_PATH
from ml.feature_engineering import add_ai4i_interactions, add_rul_interactions
from ml.preprocess import confidence_from_probability, feature_frame, rul_payload_for_vehicle, sensor_payload_for_vehicle
from ml.train_classifier import train as train_classifier
from ml.train_rul import train as train_rul

INFERENCE_CACHE_SECONDS = 45.0

FEATURE_LABELS = {
    "type_code": "Machine type",
    "air_temperature_k": "Ambient temperature",
    "process_temperature_k": "Coolant temperature",
    "rotational_speed_rpm": "RPM",
    "torque_nm": "Torque",
    "tool_wear_min": "Brake and tool wear",
    "engine_vibration": "Engine vibration",
    "thermal_delta": "Thermal delta",
    "mechanical_power_proxy": "Power load",
    "wear_torque_index": "Wear torque index",
    "vibration_load_index": "Vibration load index",
}


class MLInferenceEngine:
    def __init__(self) -> None:
        self._prediction_cache: dict[str, tuple[float, PredictionResponse]] = {}
        self._payload_cache: dict[str, tuple[float, SensorPayload]] = {}
        self._rul_cache: dict[str, tuple[float, RulResponse]] = {}

    def clear_vehicle_cache(self, vehicle_id: str) -> None:
        self._prediction_cache.pop(vehicle_id, None)
        self._payload_cache.pop(vehicle_id, None)
        self._rul_cache.pop(vehicle_id, None)

    @cached_property
    def failure_artifact(self) -> dict[str, Any]:
        if not FAILURE_MODEL_PATH.exists():
            train_classifier()
        return joblib.load(FAILURE_MODEL_PATH)

    @cached_property
    def rul_artifact(self) -> dict[str, Any]:
        if not RUL_MODEL_PATH.exists():
            train_rul()
        return joblib.load(RUL_MODEL_PATH)

    @cached_property
    def shap_explainer(self) -> shap.TreeExplainer:
        return shap.TreeExplainer(self.failure_artifact["model"])

    def _live_payload(self, vehicle_id: str, payload: SensorPayload | None = None) -> SensorPayload:
        if payload and any(value is not None for key, value in payload.model_dump().items() if key != "vehicle_id"):
            return payload
        now = time.monotonic()
        cached = self._payload_cache.get(vehicle_id)
        if cached and now - cached[0] < INFERENCE_CACHE_SECONDS:
            return cached[1]
        live = telemetry_service.payload(vehicle_id)
        self._payload_cache[vehicle_id] = (now, live)
        return live

    def _failure_frame(self, vehicle_id: str, payload: SensorPayload | None = None) -> pd.DataFrame:
        live = self._live_payload(vehicle_id, payload)
        sensor_values = sensor_payload_for_vehicle(vehicle_id, live)
        engineered = add_ai4i_interactions(feature_frame(sensor_values, AI4I_FEATURES))
        return engineered[self.failure_artifact["features"]]

    def _rul_frame(self, vehicle_id: str, probability: float) -> pd.DataFrame:
        values = rul_payload_for_vehicle(vehicle_id, probability)
        engineered = add_rul_interactions(feature_frame(values, RUL_FEATURES))
        return engineered[self.rul_artifact["features"]]

    def predict_failure(self, vehicle_id: str, payload: SensorPayload | None = None) -> PredictionResponse:
        cache_key = vehicle_id if payload is None else ""
        now = time.monotonic()
        if cache_key in self._prediction_cache:
            cached_at, cached = self._prediction_cache[cache_key]
            if now - cached_at < INFERENCE_CACHE_SECONDS:
                return cached
        start = time.perf_counter()
        live = self._live_payload(vehicle_id, payload)
        frame = self._failure_frame(vehicle_id, live)
        raw_probability = float(self.failure_artifact["model"].predict_proba(frame)[0, 1])
        probability = self._calibrated_probability(vehicle_id, live, raw_probability)
        failure_class = "Failure likely" if probability >= 0.5 else "Normal"
        component = self._component_from_features(frame.iloc[0], probability)
        confidence = confidence_from_probability(probability)
        elapsed_ms = (time.perf_counter() - start) * 1000
        telemetry_service.prediction_count += 1
        telemetry_service.latencies.append(elapsed_ms)
        telemetry_service.latencies[:] = telemetry_service.latencies[-200:]
        response = PredictionResponse(vehicle_id=vehicle_id, failure_probability=probability, failure_class=failure_class, confidence=confidence, predicted_component=component)
        repository.save_prediction(response, elapsed_ms)
        if cache_key:
            self._prediction_cache[cache_key] = (now, response)
        return response

    def predict_rul(self, vehicle_id: str) -> RulResponse:
        now = time.monotonic()
        cached = self._rul_cache.get(vehicle_id)
        if cached and now - cached[0] < INFERENCE_CACHE_SECONDS:
            return cached[1]
        probability = self.predict_failure(vehicle_id).failure_probability
        frame = self._rul_frame(vehicle_id, probability)
        raw = float(self.rul_artifact["model"].predict(frame)[0])
        prediction = max(1, int(round(raw * (1.0 - min(0.55, probability * 0.35)))))
        confidence = float(max(0.54, min(0.96, 1.0 - probability * 0.35)))
        spread = max(3, round(prediction * (1.0 - confidence + 0.1)))
        response = RulResponse(vehicle_id=vehicle_id, rul_days=prediction, lower_bound_days=max(1, prediction - spread), upper_bound_days=prediction + spread, confidence=confidence)
        self._rul_cache[vehicle_id] = (now, response)
        return response

    def health_score(self, vehicle_id: str) -> int:
        probability = self.predict_failure(vehicle_id).failure_probability
        return int(max(0, min(100, round(100 - probability * 100))))

    def shap_values(self, vehicle_id: str) -> list[ShapFeature]:
        frame = self._failure_frame(vehicle_id)
        values = self.shap_explainer.shap_values(frame)
        if isinstance(values, list):
            values = values[-1]
        row_values = np.asarray(values)[0]
        row = frame.iloc[0]
        ranked = sorted(zip(frame.columns, row_values), key=lambda item: abs(float(item[1])), reverse=True)[:8]
        return [ShapFeature(feature=FEATURE_LABELS.get(feature, feature), value=float(row[feature]), contribution=float(contribution), direction="risk" if contribution >= 0 else "protective") for feature, contribution in ranked]

    def explanation(self, vehicle_id: str) -> ExplanationResponse:
        vehicle = get_vehicle(vehicle_id)
        prediction = self.predict_failure(vehicle_id)
        rul = self.predict_rul(vehicle_id)
        shap_top = self.shap_values(vehicle_id)[:4]
        recommendation = next(item for item in self.recommendations() if item.vehicleId == vehicle_id)
        risk_drivers = [feature.feature for feature in shap_top if feature.direction == "risk"] or [feature.feature for feature in shap_top[:2]]
        protective = [feature.feature for feature in shap_top if feature.direction == "protective"]
        headline = f"{vehicle_id} is {recommendation.riskLevel.value.lower()} because risk is {prediction.failure_probability:.0%} and RUL is {rul.rul_days} days."
        evidence = [
            f"Top model drivers: {', '.join(risk_drivers[:3])}.",
            f"Route {vehicle.route} carries INR {vehicle.revenuePerDay:,} revenue per day.",
            f"Prediction confidence is {prediction.confidence:.0%}; uncertainty window is {rul.lower_bound_days}-{rul.upper_bound_days} days.",
        ]
        if protective:
            evidence.append(f"Protective signals: {', '.join(protective[:2])}.")
        explanation = f"The model sees an elevated maintenance pattern around {', '.join(risk_drivers[:3])}. Combined with current telemetry, service history, and route exposure, VehiSense IQ recommends {recommendation.action.lower()} for {recommendation.component}."
        return ExplanationResponse(vehicle_id=vehicle_id, headline=headline, explanation=explanation, evidence=evidence, recommended_next_step=f"{recommendation.action}: {recommendation.component}")

    def priority_for_vehicle(self, vehicle_id: str) -> Priority:
        vehicle = get_vehicle(vehicle_id)
        prediction = self.predict_failure(vehicle_id)
        rul = self.predict_rul(vehicle_id)
        critical_route = vehicle.revenuePerDay >= 50000 or vehicle.route in {"MAA-BLR", "AMD-SRT", "DEL-JAI"}
        score = prediction.failure_probability * 62 + max(0, 30 - rul.rul_days) * 0.9 + (vehicle.revenuePerDay / 50000) * 10 + (14 if critical_route else 0)
        if score >= 74:
            return Priority.critical
        if score >= 54:
            return Priority.high
        if score >= 30:
            return Priority.medium
        return Priority.low

    def fleet_with_ai(self):
        rows = []
        for vehicle in FLEET:
            prediction = self.predict_failure(vehicle.id)
            rul = self.predict_rul(vehicle.id)
            priority = self.priority_for_vehicle(vehicle.id)
            status = "At risk" if priority == Priority.critical else "Service scheduled" if priority == Priority.high else "Inspection due" if priority == Priority.medium else "Operational"
            data = vehicle.model_dump()
            data.update(healthScore=int(max(0, min(100, round(100 - prediction.failure_probability * 100)))), failureProbability=prediction.failure_probability, rulDays=rul.rul_days, priority=priority, status=status)
            rows.append(data)
        return rows

    def recommendations(self) -> list[Recommendation]:
        items: list[Recommendation] = []
        for vehicle in FLEET:
            prediction = self.predict_failure(vehicle.id)
            rul = self.predict_rul(vehicle.id)
            priority = self.priority_for_vehicle(vehicle.id)
            shap_top = self.shap_values(vehicle.id)[:3]
            history = telemetry_service.maintenance_history(vehicle.id)
            component = prediction.predicted_component
            if priority == Priority.critical:
                action, downtime, base_cost = "Immediate Maintenance", 18.0, 150000
            elif priority == Priority.high:
                action, downtime, base_cost = "Replace part", 9.0, 85000
            elif priority == Priority.medium:
                action, downtime, base_cost = "Schedule inspection", 3.0, 30000
            else:
                action, downtime, base_cost = "Continue operation", 0.5, 7000
            history_factor = 0.9 if history and not history[-1].failure_related else 1.15
            cost = int(base_cost * history_factor * (1 + prediction.failure_probability * 0.45))
            drivers = ", ".join(feature.feature for feature in shap_top)
            rationale = f"Chosen because {prediction.failure_probability:.0%} failure risk, {rul.rul_days} days RUL, {vehicle.revenuePerDay:,} INR/day route exposure, recent service history, and SHAP drivers: {drivers}."
            item = Recommendation(vehicleId=vehicle.id, action=action, component=component, estimatedRepairCost=cost, estimatedDowntimeHours=downtime, riskLevel=priority, rationale=rationale)
            repository.save_recommendation(item)
            items.append(item)
        return items

    def priority(self):
        return sorted(self.fleet_with_ai(), key=lambda vehicle: vehicle["failureProbability"] * vehicle["revenuePerDay"] * max(2, 12 - vehicle["rulDays"] / 10), reverse=True)

    def forecast(self) -> list[ForecastPoint]:
        fleet = self.fleet_with_ai()
        points = []
        for days in (7, 30, 90):
            expected = sum(min(0.98, row["failureProbability"] * (days / max(row["rulDays"], 1)) ** 0.55) for row in fleet)
            confidence = sum(max(0.55, 1 - row["failureProbability"] * 0.25) for row in fleet) / max(len(fleet), 1)
            points.append(ForecastPoint(horizon=f"{days} days", expected_failures=int(round(expected)), confidence=round(confidence, 2)))
        return points

    def edge_inference(self, payload: SensorPayload) -> EdgeInferenceResponse:
        start = time.perf_counter()
        live = self._live_payload(payload.vehicle_id, payload)
        prediction = self.predict_failure(payload.vehicle_id, live)
        elapsed_ms = (time.perf_counter() - start) * 1000
        telemetry_service.latencies.append(elapsed_ms)
        telemetry_service.prediction_count += 1
        fallback = telemetry_service.snapshot(payload.vehicle_id)
        return EdgeInferenceResponse(vehicle_id=payload.vehicle_id, rpm=live.rotational_speed_rpm or fallback.rpm, temperature=live.process_temperature_k or fallback.coolant_temperature_c + 273.15, torque=live.torque_nm or fallback.torque_nm, vibration=live.engine_vibration or fallback.engine_vibration, inference_time_ms=round(elapsed_ms, 2), confidence=prediction.confidence, prediction=prediction.failure_class, failure_probability=prediction.failure_probability)

    def _calibrated_probability(self, vehicle_id: str, payload: SensorPayload, raw_probability: float) -> float:
        vehicle = get_vehicle(vehicle_id)
        mileage_stress = min(1.0, vehicle.mileageKm / 360000)
        engine_hour_stress = min(1.0, vehicle.engineHours / 12500)
        temp_c = (payload.process_temperature_k or 308.0) - 273.15
        vibration = payload.engine_vibration or 0.4
        torque = payload.torque_nm or 38.0
        wear = payload.tool_wear_min or 45.0
        temp_risk = max(0.0, min(1.0, (temp_c - 35.0) / 70.0))
        vibration_risk = max(0.0, min(1.0, vibration / 2.2))
        torque_risk = max(0.0, min(1.0, (torque - 28.0) / 34.0))
        wear_risk = max(0.0, min(1.0, wear / 210.0))
        business_duty = min(1.0, vehicle.revenuePerDay / 60000)
        telemetry_risk = 0.18 * mileage_stress + 0.16 * engine_hour_stress + 0.18 * temp_risk + 0.2 * vibration_risk + 0.14 * torque_risk + 0.1 * wear_risk + 0.04 * business_duty
        blended = raw_probability * 0.58 + telemetry_risk * 0.42
        return float(max(0.015, min(0.985, blended)))

    def _component_from_features(self, row: pd.Series, probability: float) -> str:
        if row["tool_wear_min"] > 190 or row.get("wear_torque_index", 0) > 95:
            return "Brake, tyre and drivetrain wear package"
        if row["process_temperature_k"] - row["air_temperature_k"] > 11 or row["process_temperature_k"] > 371:
            return "Cooling and lubrication system"
        if row["torque_nm"] > 55 or row.get("vibration_load_index", 0) > 70:
            return "Torque path and mount assembly"
        if probability >= 0.5:
            return "Powertrain sensor cluster"
        return "No immediate component"


engine = MLInferenceEngine()




