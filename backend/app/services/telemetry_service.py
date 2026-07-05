from __future__ import annotations

import math
import random
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from app.data import FLEET, get_vehicle
from app.repositories.persistence import repository
from app.schemas import Alert, MaintenanceEvent, Priority, SensorPayload, TelemetrySnapshot

WEATHER = ["Clear", "Humid", "Hot", "Rain", "Dust"]
CRITICAL_ROUTES = {"AMD-SRT", "MAA-BLR", "DEL-JAI"}

HISTORY: dict[str, list[MaintenanceEvent]] = {
    vehicle.id: [
        MaintenanceEvent(date="2026-04-12", type="Preventive service", parts_replaced=["Oil filter", "Air filter"], technician_notes="Baseline service completed; no abnormal wear found.", repair_cost=18000, downtime_hours=2.5),
        MaintenanceEvent(date="2026-05-06", type="Inspection", parts_replaced=["Brake pads"] if vehicle.mileageKm > 240000 else [], technician_notes="Brake, thermal and drivetrain checks recorded.", repair_cost=32000 if vehicle.mileageKm > 240000 else 9000, downtime_hours=4.0 if vehicle.mileageKm > 240000 else 1.5),
        MaintenanceEvent(date=vehicle.lastServiceDate, type="Scheduled service", parts_replaced=["Coolant", "Lubricants"], technician_notes="ECU diagnostics synced to VehiSense IQ.", repair_cost=22000, downtime_hours=2.0),
    ]
    for vehicle in FLEET
}

@dataclass
class VehicleTelemetryState:
    age_years: float
    cargo_load_pct: float
    route_difficulty: float
    driver_behavior_score: float
    weather_index: int
    degradation: float
    tick: int = 0


class TelemetryService:
    def __init__(self) -> None:
        self.states: dict[str, VehicleTelemetryState] = {}
        self.snapshots: dict[str, TelemetrySnapshot] = {}
        self.alert_log: list[Alert] = []
        self.prediction_count = 0
        self.latencies: list[float] = []
        random.seed(72)
        for index, vehicle in enumerate(FLEET):
            stress = min(1.0, vehicle.mileageKm / 360000)
            self.states[vehicle.id] = VehicleTelemetryState(
                age_years=2.0 + stress * 6.5,
                cargo_load_pct=54 + (index * 7) % 36,
                route_difficulty=0.45 + (0.35 if vehicle.route in CRITICAL_ROUTES else 0.12) + stress * 0.2,
                driver_behavior_score=max(0.35, min(0.96, 0.82 - stress * 0.28 + (index % 3) * 0.04)),
                weather_index=index % len(WEATHER),
                degradation=stress,
            )

    def snapshot(self, vehicle_id: str) -> TelemetrySnapshot:
        vehicle = get_vehicle(vehicle_id)
        state = self.states[vehicle_id]
        state.tick += 1
        if state.tick % 18 == 0:
            state.weather_index = (state.weather_index + 1) % len(WEATHER)
        maintenance_factor = self._maintenance_factor(vehicle_id)
        weather_penalty = [0.0, 0.06, 0.11, 0.08, 0.09][state.weather_index]
        oscillation = math.sin(state.tick / 3.0 + len(vehicle_id))
        noise = lambda spread: random.uniform(-spread, spread)
        load = min(1.0, max(0.2, state.cargo_load_pct / 100 + state.route_difficulty * 0.25 - state.driver_behavior_score * 0.12 + weather_penalty))
        degradation = max(0.02, min(1.0, state.degradation * maintenance_factor + state.tick * 0.0009))
        rpm = 1500 + load * 380 - degradation * 120 + oscillation * 45 + noise(18)
        coolant = 74 + load * 20 + degradation * 15 + weather_penalty * 24 + noise(1.8)
        oil_temp = coolant + 8 + degradation * 8 + noise(1.5)
        oil_pressure = max(1.4, 4.8 - degradation * 1.8 - load * 0.7 + noise(0.12))
        fuel_pressure = max(2.0, 5.9 - degradation * 0.8 + load * 0.4 + noise(0.15))
        battery = max(10.8, 13.7 - degradation * 0.9 - weather_penalty * 0.5 + noise(0.08))
        vibration = max(0.08, 0.25 + degradation * 2.0 + load * 0.55 - state.driver_behavior_score * 0.22 + noise(0.08))
        brake_wear = min(100.0, 18 + degradation * 64 + state.route_difficulty * 16 + noise(1.0))
        tyre_pressure = max(26.0, 36.5 - load * 3.8 - degradation * 2.2 + noise(0.5))
        torque = 30 + load * 35 + degradation * 8 + noise(1.5)
        ambient = 24 + state.weather_index * 2.6 + noise(1.0)
        snapshot = TelemetrySnapshot(
            vehicle_id=vehicle_id,
            timestamp=datetime.now(timezone.utc).isoformat(),
            rpm=round(rpm, 1),
            coolant_temperature_c=round(coolant, 1),
            oil_temperature_c=round(oil_temp, 1),
            oil_pressure_bar=round(oil_pressure, 2),
            fuel_pressure_bar=round(fuel_pressure, 2),
            battery_voltage=round(battery, 2),
            engine_vibration=round(vibration, 3),
            brake_wear_pct=round(brake_wear, 1),
            tyre_pressure_psi=round(tyre_pressure, 1),
            torque_nm=round(torque, 1),
            engine_load_pct=round(load * 100, 1),
            ambient_temperature_c=round(ambient, 1),
            cargo_load_pct=round(state.cargo_load_pct, 1),
            route_difficulty=round(state.route_difficulty, 2),
            driver_behavior_score=round(state.driver_behavior_score, 2),
            weather=WEATHER[state.weather_index],
        )
        self.snapshots[vehicle_id] = snapshot
        self._generate_alerts(snapshot)
        return snapshot

    def all_snapshots(self) -> list[TelemetrySnapshot]:
        return [self.snapshot(vehicle.id) for vehicle in FLEET]

    def payload(self, vehicle_id: str) -> SensorPayload:
        snap = self.snapshot(vehicle_id)
        return SensorPayload(
            vehicle_id=vehicle_id,
            air_temperature_k=snap.ambient_temperature_c + 273.15,
            process_temperature_k=snap.ambient_temperature_c + 273.15 + 8.0 + max(0.0, snap.coolant_temperature_c - 84.0) * 0.22,
            rotational_speed_rpm=1350 + (snap.rpm - 1350) * 0.72,
            torque_nm=24 + snap.engine_load_pct * 0.31,
            tool_wear_min=min(230, snap.brake_wear_pct * 1.05 + snap.engine_vibration * 5),
            engine_vibration=snap.engine_vibration * 0.52,
            coolant_temperature_c=snap.coolant_temperature_c,
            oil_temperature_c=snap.oil_temperature_c,
            oil_pressure_bar=snap.oil_pressure_bar,
            fuel_pressure_bar=snap.fuel_pressure_bar,
            battery_voltage=snap.battery_voltage,
            brake_wear_pct=snap.brake_wear_pct,
            tyre_pressure_psi=snap.tyre_pressure_psi,
            engine_load_pct=snap.engine_load_pct,
            ambient_temperature_c=snap.ambient_temperature_c,
        )

    def alerts(self) -> list[Alert]:
        return sorted(self.alert_log[-80:], key=lambda alert: alert.timestamp, reverse=True)

    def maintenance_history(self, vehicle_id: str) -> list[MaintenanceEvent]:
        return HISTORY[vehicle_id]

    def apply_maintenance(self, vehicle_id: str) -> None:
        state = self.states[vehicle_id]
        state.degradation = max(0.03, state.degradation * 0.52)
        HISTORY[vehicle_id].append(MaintenanceEvent(date=datetime.now(timezone.utc).date().isoformat(), type="AI-recommended maintenance", parts_replaced=["Risk component", "Lubricants"], technician_notes="Demo mode maintenance restored degraded telemetry baseline.", repair_cost=68000, downtime_hours=6.0, failure_related=True))

    def _maintenance_factor(self, vehicle_id: str) -> float:
        recent = HISTORY[vehicle_id][-1]
        try:
            days = (datetime.now(timezone.utc).date() - datetime.fromisoformat(recent.date).date()).days
        except ValueError:
            days = 45
        return 0.82 if days < 20 else 0.94 if days < 60 else 1.0

    def _generate_alerts(self, snap: TelemetrySnapshot) -> None:
        candidates: list[tuple[Priority, str, str]] = []
        if snap.engine_vibration > 2.0:
            candidates.append((Priority.critical, "Critical vibration detected", "Engine vibration is above the safe operating envelope."))
        if snap.coolant_temperature_c > 98:
            candidates.append((Priority.high, "Temperature rising rapidly", "Coolant temperature trend indicates thermal stress."))
        if snap.brake_wear_pct > 78:
            candidates.append((Priority.high, "Brake wear exceeds threshold", "Brake wear is above planned maintenance limits."))
        if snap.battery_voltage < 12.0:
            candidates.append((Priority.medium, "Battery anomaly detected", "Battery voltage is below expected range."))
        if snap.oil_pressure_bar < 2.2:
            candidates.append((Priority.high, "Oil pressure degradation", "Oil pressure is trending below operating target."))
        now = datetime.now(timezone.utc).isoformat()
        existing = {(alert.vehicle_id, alert.title) for alert in self.alert_log[-30:]}
        for severity, title, message in candidates:
            if (snap.vehicle_id, title) not in existing:
                self.alert_log.append(Alert(id=f"{snap.vehicle_id}-{title}-{len(self.alert_log)}", vehicle_id=snap.vehicle_id, severity=severity, title=title, message=message, timestamp=now))


telemetry_service = TelemetryService()



