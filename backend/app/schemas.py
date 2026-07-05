from enum import Enum
from pydantic import BaseModel, Field, field_validator


class Priority(str, Enum):
    critical = "Critical"
    high = "High"
    medium = "Medium"
    low = "Low"


class Vehicle(BaseModel):
    id: str
    make: str
    model: str
    depot: str
    route: str
    active: bool
    healthScore: int
    failureProbability: float
    rulDays: int
    priority: Priority
    status: str
    lastServiceDate: str
    mileageKm: int
    engineHours: int
    revenuePerDay: int


class SensorPayload(BaseModel):
    vehicle_id: str = Field(..., examples=["GJ01-DL-2290"])
    air_temperature_k: float | None = None
    process_temperature_k: float | None = None
    rotational_speed_rpm: float | None = None
    torque_nm: float | None = None
    tool_wear_min: float | None = None
    engine_vibration: float | None = None
    coolant_temperature_c: float | None = None
    oil_temperature_c: float | None = None
    oil_pressure_bar: float | None = None
    fuel_pressure_bar: float | None = None
    battery_voltage: float | None = None
    brake_wear_pct: float | None = None
    tyre_pressure_psi: float | None = None
    engine_load_pct: float | None = None
    ambient_temperature_c: float | None = None

    @field_validator(
        "air_temperature_k",
        "process_temperature_k",
        "rotational_speed_rpm",
        "torque_nm",
        "tool_wear_min",
        "engine_vibration",
        "coolant_temperature_c",
        "oil_temperature_c",
        "oil_pressure_bar",
        "fuel_pressure_bar",
        "battery_voltage",
        "brake_wear_pct",
        "tyre_pressure_psi",
        "engine_load_pct",
        "ambient_temperature_c",
    )
    @classmethod
    def clamp_sensor_values(cls, value: float | None, info):
        if value is None:
            return value
        bounds = {
            "air_temperature_k": (250.0, 340.0),
            "process_temperature_k": (260.0, 390.0),
            "rotational_speed_rpm": (500.0, 3200.0),
            "torque_nm": (5.0, 95.0),
            "tool_wear_min": (0.0, 260.0),
            "engine_vibration": (0.0, 5.0),
            "coolant_temperature_c": (20.0, 130.0),
            "oil_temperature_c": (20.0, 150.0),
            "oil_pressure_bar": (0.5, 8.0),
            "fuel_pressure_bar": (1.0, 9.0),
            "battery_voltage": (9.0, 15.5),
            "brake_wear_pct": (0.0, 100.0),
            "tyre_pressure_psi": (18.0, 48.0),
            "engine_load_pct": (0.0, 100.0),
            "ambient_temperature_c": (-10.0, 55.0),
        }
        low, high = bounds[info.field_name]
        return max(low, min(high, float(value)))


class PredictionRequest(SensorPayload):
    pass


class PredictionResponse(BaseModel):
    vehicle_id: str
    failure_probability: float
    failure_class: str
    confidence: float
    predicted_component: str


class HealthScoreResponse(BaseModel):
    vehicle_id: str
    health_score: int


class RulResponse(BaseModel):
    vehicle_id: str
    rul_days: int
    lower_bound_days: int
    upper_bound_days: int
    confidence: float


class ShapFeature(BaseModel):
    feature: str
    value: float
    contribution: float
    direction: str


class Recommendation(BaseModel):
    vehicleId: str
    action: str
    component: str
    estimatedRepairCost: int
    estimatedDowntimeHours: float
    riskLevel: Priority
    rationale: str



class ExplanationResponse(BaseModel):
    vehicle_id: str
    headline: str
    explanation: str
    evidence: list[str]
    recommended_next_step: str

class EdgeInferenceResponse(BaseModel):
    vehicle_id: str
    rpm: float
    temperature: float
    torque: float
    vibration: float
    inference_time_ms: float
    confidence: float
    prediction: str
    failure_probability: float


class TelemetrySnapshot(BaseModel):
    vehicle_id: str
    timestamp: str
    rpm: float
    coolant_temperature_c: float
    oil_temperature_c: float
    oil_pressure_bar: float
    fuel_pressure_bar: float
    battery_voltage: float
    engine_vibration: float
    brake_wear_pct: float
    tyre_pressure_psi: float
    torque_nm: float
    engine_load_pct: float
    ambient_temperature_c: float
    cargo_load_pct: float
    route_difficulty: float
    driver_behavior_score: float
    weather: str


class MaintenanceEvent(BaseModel):
    date: str
    type: str
    parts_replaced: list[str]
    technician_notes: str
    repair_cost: int
    downtime_hours: float
    failure_related: bool = False


class Alert(BaseModel):
    id: str
    vehicle_id: str
    severity: Priority
    title: str
    message: str
    timestamp: str


class DigitalTwinVehicle(BaseModel):
    vehicle: Vehicle
    telemetry: TelemetrySnapshot
    prediction: PredictionResponse
    rul: RulResponse
    recommendation: Recommendation
    alerts: list[Alert]


class TimelineEvent(BaseModel):
    label: str
    date: str
    status: str
    description: str


class ForecastPoint(BaseModel):
    horizon: str
    expected_failures: int
    confidence: float


class FleetAnalytics(BaseModel):
    fleet_availability: float
    average_health: float
    average_rul: float
    predicted_monthly_failures: int
    maintenance_cost_saved: int
    downtime_avoided_hours: float
    average_ai_confidence: float


class ModelMonitoring(BaseModel):
    prediction_drift: float
    feature_drift: float
    average_confidence: float
    average_inference_latency_ms: float
    model_accuracy: float
    prediction_count: int
    cpu_usage_pct: float
    memory_usage_pct: float
    model_version: str
    last_sync_time: str
    cloud_sync_status: str



