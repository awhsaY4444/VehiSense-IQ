from __future__ import annotations

from contextlib import contextmanager
from typing import Iterator

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, init_db
from app.models.persistence import PredictionLog, RecommendationRecord, ReportRecord, TelemetryRecord
from app.schemas import PredictionResponse, Recommendation, TelemetrySnapshot


class PersistenceRepository:
    def __init__(self) -> None:
        self.enabled = False
        try:
            init_db()
            self.enabled = True
        except SQLAlchemyError:
            self.enabled = False
        except Exception:
            self.enabled = False

    @contextmanager
    def session(self) -> Iterator[Session | None]:
        if not self.enabled:
            yield None
            return
        db = SessionLocal()
        try:
            yield db
            db.commit()
        except Exception:
            db.rollback()
        finally:
            db.close()

    def save_telemetry(self, item: TelemetrySnapshot) -> None:
        with self.session() as db:
            if db is None:
                return
            db.add(TelemetryRecord(vehicle_id=item.vehicle_id, rpm=item.rpm, coolant_temperature_c=item.coolant_temperature_c, oil_temperature_c=item.oil_temperature_c, oil_pressure_bar=item.oil_pressure_bar, battery_voltage=item.battery_voltage, engine_vibration=item.engine_vibration, brake_wear_pct=item.brake_wear_pct, torque_nm=item.torque_nm))

    def save_prediction(self, prediction: PredictionResponse, latency_ms: float) -> None:
        with self.session() as db:
            if db is None:
                return
            db.add(PredictionLog(vehicle_id=prediction.vehicle_id, failure_probability=prediction.failure_probability, confidence=prediction.confidence, predicted_component=prediction.predicted_component, latency_ms=latency_ms))

    def save_recommendation(self, item: Recommendation) -> None:
        with self.session() as db:
            if db is None:
                return
            db.add(RecommendationRecord(vehicle_id=item.vehicleId, action=item.action, component=item.component, estimated_repair_cost=item.estimatedRepairCost, estimated_downtime_hours=item.estimatedDowntimeHours, rationale=item.rationale))

    def save_report(self, vehicle_id: str, summary: str) -> None:
        with self.session() as db:
            if db is None:
                return
            db.add(ReportRecord(vehicle_id=vehicle_id, summary=summary))


repository = PersistenceRepository()
