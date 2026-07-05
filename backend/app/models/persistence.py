from datetime import datetime
from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class FleetRecord(Base):
    __tablename__ = "fleet"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    make: Mapped[str] = mapped_column(String(80))
    model: Mapped[str] = mapped_column(String(120))
    depot: Mapped[str] = mapped_column(String(120))
    route: Mapped[str] = mapped_column(String(80))
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    mileage_km: Mapped[int] = mapped_column(Integer)
    engine_hours: Mapped[int] = mapped_column(Integer)
    revenue_per_day: Mapped[int] = mapped_column(Integer)


class TelemetryRecord(Base):
    __tablename__ = "telemetry"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    vehicle_id: Mapped[str] = mapped_column(String(64), index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    rpm: Mapped[float] = mapped_column(Float)
    coolant_temperature_c: Mapped[float] = mapped_column(Float)
    oil_temperature_c: Mapped[float] = mapped_column(Float)
    oil_pressure_bar: Mapped[float] = mapped_column(Float)
    battery_voltage: Mapped[float] = mapped_column(Float)
    engine_vibration: Mapped[float] = mapped_column(Float)
    brake_wear_pct: Mapped[float] = mapped_column(Float)
    torque_nm: Mapped[float] = mapped_column(Float)


class PredictionLog(Base):
    __tablename__ = "prediction_logs"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    vehicle_id: Mapped[str] = mapped_column(String(64), index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    failure_probability: Mapped[float] = mapped_column(Float)
    confidence: Mapped[float] = mapped_column(Float)
    predicted_component: Mapped[str] = mapped_column(String(160))
    latency_ms: Mapped[float] = mapped_column(Float, default=0)


class RecommendationRecord(Base):
    __tablename__ = "recommendations"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    vehicle_id: Mapped[str] = mapped_column(String(64), index=True)
    action: Mapped[str] = mapped_column(String(120))
    component: Mapped[str] = mapped_column(String(160))
    estimated_repair_cost: Mapped[int] = mapped_column(Integer)
    estimated_downtime_hours: Mapped[float] = mapped_column(Float)
    rationale: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class MaintenanceHistoryRecord(Base):
    __tablename__ = "maintenance_history"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    vehicle_id: Mapped[str] = mapped_column(String(64), index=True)
    service_date: Mapped[str] = mapped_column(String(32))
    service_type: Mapped[str] = mapped_column(String(120))
    technician_notes: Mapped[str] = mapped_column(Text)
    repair_cost: Mapped[int] = mapped_column(Integer)
    downtime_hours: Mapped[float] = mapped_column(Float)


class ReportRecord(Base):
    __tablename__ = "reports"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    vehicle_id: Mapped[str] = mapped_column(String(64), index=True)
    generated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    summary: Mapped[str] = mapped_column(Text)
