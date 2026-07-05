export type Priority = "Critical" | "High" | "Medium" | "Low";
export type RecommendationAction = "Immediate Maintenance" | "Immediate repair" | "Replace part" | "Schedule inspection" | "Continue operation";

export interface Vehicle { id: string; make: string; model: string; depot: string; route: string; active: boolean; healthScore: number; failureProbability: number; rulDays: number; priority: Priority; status: "Operational" | "Inspection due" | "Service scheduled" | "At risk"; lastServiceDate: string; mileageKm: number; engineHours: number; revenuePerDay: number; }
export interface ShapFeature { feature: string; value: number; contribution: number; direction: "risk" | "protective"; }
export interface Recommendation { vehicleId: string; action: RecommendationAction | string; component: string; estimatedRepairCost: number; estimatedDowntimeHours: number; riskLevel: Priority; rationale: string; }
export interface EdgeInference { vehicle_id: string; rpm: number; temperature: number; torque: number; vibration: number; inference_time_ms: number; confidence: number; prediction: string; failure_probability: number; }
export interface TelemetrySnapshot { vehicle_id: string; timestamp: string; rpm: number; coolant_temperature_c: number; oil_temperature_c: number; oil_pressure_bar: number; fuel_pressure_bar: number; battery_voltage: number; engine_vibration: number; brake_wear_pct: number; tyre_pressure_psi: number; torque_nm: number; engine_load_pct: number; ambient_temperature_c: number; cargo_load_pct: number; route_difficulty: number; driver_behavior_score: number; weather: string; }
export interface Alert { id: string; vehicle_id: string; severity: Priority; title: string; message: string; timestamp: string; }
export interface MaintenanceEvent { date: string; type: string; parts_replaced: string[]; technician_notes: string; repair_cost: number; downtime_hours: number; failure_related: boolean; }
export interface DigitalTwinVehicle { vehicle: Vehicle; telemetry: TelemetrySnapshot; prediction: { vehicle_id: string; failure_probability: number; failure_class: string; confidence: number; predicted_component: string }; rul: { vehicle_id: string; rul_days: number; lower_bound_days: number; upper_bound_days: number; confidence: number }; recommendation: Recommendation; alerts: Alert[]; }
export interface TimelineEvent { label: string; date: string; status: string; description: string; }
export interface ForecastPoint { horizon: string; expected_failures: number; confidence: number; }
export interface FleetAnalytics { fleet_availability: number; average_health: number; average_rul: number; predicted_monthly_failures: number; maintenance_cost_saved: number; downtime_avoided_hours: number; average_ai_confidence: number; }
export interface ModelMonitoring { prediction_drift: number; feature_drift: number; average_confidence: number; average_inference_latency_ms: number; model_accuracy: number; prediction_count: number; cpu_usage_pct: number; memory_usage_pct: number; model_version: string; last_sync_time: string; cloud_sync_status: string; }
export interface StreamPayload { fleet: Vehicle[]; telemetry: TelemetrySnapshot[]; alerts: Alert[]; analytics: FleetAnalytics; monitoring: ModelMonitoring; }

export interface ExplanationResponse { vehicle_id: string; headline: string; explanation: string; evidence: string[]; recommended_next_step: string; }

