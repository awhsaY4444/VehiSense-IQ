from __future__ import annotations

from datetime import datetime, timedelta, timezone
import json

from app.data import FLEET, get_vehicle
from app.schemas import DigitalTwinVehicle, FleetAnalytics, HealthScoreResponse, ModelMonitoring, PredictionResponse, Recommendation, RulResponse, SensorPayload, ShapFeature, TimelineEvent
from app.services.telemetry_service import telemetry_service
from ml.predict import engine


class FleetModelService:
    def fleet(self):
        return engine.fleet_with_ai()

    def predict_failure(self, vehicle_id: str, payload: SensorPayload | None = None) -> PredictionResponse:
        return engine.predict_failure(vehicle_id, payload)

    def rul(self, vehicle_id: str) -> RulResponse:
        return engine.predict_rul(vehicle_id)

    def health_score(self, vehicle_id: str) -> HealthScoreResponse:
        return HealthScoreResponse(vehicle_id=vehicle_id, health_score=engine.health_score(vehicle_id))

    def shap(self, vehicle_id: str) -> list[ShapFeature]:
        return engine.shap_values(vehicle_id)

    def explanation(self, vehicle_id: str):
        return engine.explanation(vehicle_id)

    def recommendations(self) -> list[Recommendation]:
        return engine.recommendations()

    def priority(self):
        return engine.priority()

    def edge_inference(self, payload: SensorPayload):
        return engine.edge_inference(payload)

    def telemetry(self):
        return telemetry_service.all_snapshots()

    def alerts(self):
        self.fleet()
        return telemetry_service.alerts()

    def digital_twins(self) -> list[DigitalTwinVehicle]:
        recs = {item.vehicleId: item for item in self.recommendations()}
        rows = []
        for row in self.fleet():
            vehicle_id = row["id"]
            rows.append(DigitalTwinVehicle(vehicle=row, telemetry=telemetry_service.snapshot(vehicle_id), prediction=self.predict_failure(vehicle_id), rul=self.rul(vehicle_id), recommendation=recs[vehicle_id], alerts=[alert for alert in telemetry_service.alerts() if alert.vehicle_id == vehicle_id][:4]))
        return rows

    def maintenance_history(self, vehicle_id: str):
        return telemetry_service.maintenance_history(vehicle_id)

    def timeline(self, vehicle_id: str) -> list[TimelineEvent]:
        vehicle = get_vehicle(vehicle_id)
        history = telemetry_service.maintenance_history(vehicle_id)
        prediction = self.predict_failure(vehicle_id)
        rul = self.rul(vehicle_id)
        today = datetime.now(timezone.utc).date()
        expected_failure = today + timedelta(days=rul.rul_days)
        window_start = today + timedelta(days=max(1, min(rul.rul_days - 2, 14)))
        events = [TimelineEvent(label=item.type, date=item.date, status="completed", description=f"{', '.join(item.parts_replaced) or 'Inspection'} - INR {item.repair_cost:,}, {item.downtime_hours}h downtime") for item in history]
        events.extend([
            TimelineEvent(label="Current health", date=today.isoformat(), status="active", description=f"Health {self.health_score(vehicle_id).health_score}/100, failure risk {prediction.failure_probability:.0%}."),
            TimelineEvent(label="Predicted degradation", date=(today + timedelta(days=max(1, rul.rul_days // 2))).isoformat(), status="forecast", description="Telemetry trajectory indicates accelerated wear if route load continues."),
            TimelineEvent(label="Expected failure date", date=expected_failure.isoformat(), status="risk", description=f"Model predicts failure around this date for {vehicle.route}."),
            TimelineEvent(label="Maintenance window", date=window_start.isoformat(), status="recommended", description="Recommended intervention window before route revenue is exposed."),
        ])
        return events

    def forecast(self):
        return engine.forecast()

    def analytics(self) -> FleetAnalytics:
        fleet = self.fleet()
        recs = self.recommendations()
        rec_by_vehicle = {item.vehicleId: item for item in recs}
        avg_health = sum(row["healthScore"] for row in fleet) / max(len(fleet), 1)
        avg_rul = sum(row["rulDays"] for row in fleet) / max(len(fleet), 1)
        critical = sum(1 for row in fleet if getattr(row["priority"], "value", row["priority"]) == "Critical")
        avg_conf = sum(self.predict_failure(row["id"]).confidence for row in fleet) / max(len(fleet), 1)
        upcoming_from_fleet = sum(1 for row in fleet if row["failureProbability"] >= 0.5 or row["rulDays"] <= 10 or getattr(row["priority"], "value", row["priority"]) in {"Critical", "High"})
        forecast_30 = self.forecast()[1].expected_failures
        predicted_failures = max(forecast_30, upcoming_from_fleet)
        avoided_hours = 0.0
        reactive_cost = 0.0
        planned_cost = 0.0
        for row in fleet:
            rec = rec_by_vehicle[row["id"]]
            priority_value = getattr(row["priority"], "value", row["priority"])
            if priority_value in {"Critical", "High"} or row["rulDays"] <= 10:
                delayed_downtime = rec.estimatedDowntimeHours + max(2.0, (14 - min(row["rulDays"], 14)) * 1.35) + row["failureProbability"] * 10.0
                avoided_hours += max(0.0, delayed_downtime - rec.estimatedDowntimeHours)
            delay_multiplier = 1.0 + row["failureProbability"] * 0.75 + max(0, 14 - row["rulDays"]) * 0.045
            reactive_cost += rec.estimatedRepairCost * delay_multiplier
            planned_cost += rec.estimatedRepairCost
        maintenance_saved = max(0, int(reactive_cost - planned_cost))
        return FleetAnalytics(fleet_availability=round(1 - critical / max(len(fleet), 1), 3), average_health=round(avg_health, 1), average_rul=round(avg_rul, 1), predicted_monthly_failures=predicted_failures, maintenance_cost_saved=maintenance_saved, downtime_avoided_hours=round(avoided_hours, 1), average_ai_confidence=round(avg_conf, 2))

    def monitoring(self) -> ModelMonitoring:
        latencies = telemetry_service.latencies or [12.0]
        fleet = self.fleet()
        avg_conf = sum(self.predict_failure(row["id"]).confidence for row in fleet) / max(len(fleet), 1)
        vibration_values = [telemetry_service.snapshot(row["id"]).engine_vibration for row in fleet]
        drift = min(1.0, max(0.0, (sum(vibration_values) / len(vibration_values) - 1.0) / 2.5))
        avg_latency = sum(latencies) / len(latencies)
        alert_pressure = len(telemetry_service.alerts()) / max(len(fleet), 1)
        cpu_usage = min(92.0, 34.0 + avg_latency * 0.55 + drift * 18.0)
        memory_usage = min(88.0, 48.0 + alert_pressure * 8.0 + drift * 14.0)
        feature_drift = min(1.0, drift * 0.82 + avg_latency / 1000.0)
        return ModelMonitoring(prediction_drift=round(drift, 3), feature_drift=round(feature_drift, 3), average_confidence=round(avg_conf, 3), average_inference_latency_ms=round(avg_latency, 2), model_accuracy=0.982, prediction_count=telemetry_service.prediction_count, cpu_usage_pct=round(cpu_usage, 1), memory_usage_pct=round(memory_usage, 1), model_version="failure-xgb-ai4i-v1 / rul-xgb-cmapss-v1", last_sync_time=datetime.now(timezone.utc).isoformat(), cloud_sync_status="Healthy")

    def demo_tick(self):
        rows = self.fleet()
        for row in rows:
            if row["failureProbability"] > 0.92 and row["rulDays"] <= 3:
                telemetry_service.apply_maintenance(row["id"])
                engine.clear_vehicle_cache(row["id"])
        return {"fleet": self.fleet(), "alerts": self.alerts(), "analytics": self.analytics()}

    def stream_payload(self) -> str:
        return json.dumps({"fleet": self.fleet(), "telemetry": [item.model_dump() for item in self.telemetry()], "alerts": [item.model_dump() for item in self.alerts()], "analytics": self.analytics().model_dump(), "monitoring": self.monitoring().model_dump()}, default=str)


model_service = FleetModelService()





