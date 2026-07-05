import { fleet, recommendations, shapFeatures } from "@/data/fleet";
import type { Alert, DigitalTwinVehicle, EdgeInference, ExplanationResponse, FleetAnalytics, ForecastPoint, MaintenanceEvent, ModelMonitoring, Recommendation, ShapFeature, StreamPayload, TelemetrySnapshot, TimelineEvent, Vehicle } from "@/types";

const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
export const API_URL = configuredApiUrl || (import.meta.env.DEV ? "http://localhost:8000" : "");

type PredictionResponse = { vehicle_id: string; failure_probability: number; failure_class: string; confidence: number; predicted_component: string };

async function request<T>(path: string, fallback: T, init?: RequestInit): Promise<T> {
  try {
    if (!API_URL) throw new Error("VITE_API_URL is required for production builds");
    const response = await fetch(`${API_URL}${path}`, { headers: { "Content-Type": "application/json" }, ...init });
    if (!response.ok) throw new Error(`API ${response.status}`);
    return (await response.json()) as T;
  } catch (error) {
    if (import.meta.env.DEV) return fallback;
    throw error;
  }
}

function buildAnalytics(rows: Vehicle[], recs: Recommendation[]): FleetAnalytics {
  const count = Math.max(rows.length, 1);
  const critical = rows.filter((vehicle) => vehicle.priority === "Critical").length;
  const upcoming = rows.filter((vehicle) => vehicle.failureProbability >= 0.5 || vehicle.rulDays <= 10 || ["Critical", "High"].includes(vehicle.priority)).length;
  const reactiveCost = recs.reduce((sum, rec) => {
    const vehicle = rows.find((item) => item.id === rec.vehicleId);
    if (!vehicle) return sum;
    const delayMultiplier = 1 + vehicle.failureProbability * 0.75 + Math.max(0, 14 - vehicle.rulDays) * 0.045;
    return sum + rec.estimatedRepairCost * delayMultiplier;
  }, 0);
  const plannedCost = recs.reduce((sum, rec) => sum + rec.estimatedRepairCost, 0);
  const avoidedHours = rows.reduce((sum, vehicle) => {
    const rec = recs.find((item) => item.vehicleId === vehicle.id);
    if (!rec || !(vehicle.priority === "Critical" || vehicle.priority === "High" || vehicle.rulDays <= 10)) return sum;
    const delayedDowntime = rec.estimatedDowntimeHours + Math.max(2, (14 - Math.min(vehicle.rulDays, 14)) * 1.35) + vehicle.failureProbability * 10;
    return sum + Math.max(0, delayedDowntime - rec.estimatedDowntimeHours);
  }, 0);
  return {
    fleet_availability: Number((1 - critical / count).toFixed(3)),
    average_health: Number((rows.reduce((sum, vehicle) => sum + vehicle.healthScore, 0) / count).toFixed(1)),
    average_rul: Number((rows.reduce((sum, vehicle) => sum + vehicle.rulDays, 0) / count).toFixed(1)),
    predicted_monthly_failures: upcoming,
    maintenance_cost_saved: Math.max(0, Math.round(reactiveCost - plannedCost)),
    downtime_avoided_hours: Number(avoidedHours.toFixed(1)),
    average_ai_confidence: Number((rows.reduce((sum, vehicle) => sum + Math.max(0.55, Math.min(0.96, 1 - vehicle.failureProbability * 0.35)), 0) / count).toFixed(2)),
  };
}

const fallbackAnalytics = buildAnalytics(fleet, recommendations);
const emptyMonitoring: ModelMonitoring = { prediction_drift: 0, feature_drift: 0, average_confidence: fallbackAnalytics.average_ai_confidence, average_inference_latency_ms: 0, model_accuracy: 0, prediction_count: 0, cpu_usage_pct: 0, memory_usage_pct: 0, model_version: "", last_sync_time: "", cloud_sync_status: "Offline" };
const fallbackPrediction: PredictionResponse = { vehicle_id: fleet[0].id, failure_probability: fleet[0].failureProbability, failure_class: "Unavailable", confidence: fallbackAnalytics.average_ai_confidence, predicted_component: "Unavailable" };

export const api = {
  fleet: () => request<Vehicle[]>("/fleet", fleet),
  predict: (vehicleId: string) => request<PredictionResponse>("/predict", { ...fallbackPrediction, vehicle_id: vehicleId }, { method: "POST", body: JSON.stringify({ vehicle_id: vehicleId }) }),
  shap: (vehicleId: string) => request<ShapFeature[]>(`/shap?vehicle_id=${vehicleId}`, shapFeatures),
  explanation: (vehicleId: string) => request<ExplanationResponse>(`/explanation?vehicle_id=${vehicleId}`, { vehicle_id: vehicleId, headline: "AI explanation unavailable", explanation: "The explanation service is offline.", evidence: [], recommended_next_step: "Review vehicle telemetry" }),
  recommendations: () => request<Recommendation[]>("/recommendation", recommendations),
  telemetry: () => request<TelemetrySnapshot[]>("/telemetry", []),
  alerts: () => request<Alert[]>("/alerts", []),
  digitalTwin: () => request<DigitalTwinVehicle[]>("/digital-twin", []),
  timeline: (vehicleId: string) => request<TimelineEvent[]>(`/timeline?vehicle_id=${vehicleId}`, []),
  maintenanceHistory: (vehicleId: string) => request<MaintenanceEvent[]>(`/maintenance-history?vehicle_id=${vehicleId}`, []),
  forecast: () => request<ForecastPoint[]>("/forecast", []),
  analytics: () => request<FleetAnalytics>("/analytics", fallbackAnalytics),
  monitoring: () => request<ModelMonitoring>("/monitoring", emptyMonitoring),
  demoTick: () => request<StreamPayload>("/demo/tick", { fleet, telemetry: [], alerts: [], analytics: fallbackAnalytics, monitoring: emptyMonitoring }, { method: "POST" }),
  edgeInference: (payload: Record<string, number | string>) => request<EdgeInference>("/edge-inference", { vehicle_id: String(payload.vehicle_id), rpm: Number(payload.rotational_speed_rpm), temperature: Number(payload.process_temperature_k), torque: Number(payload.torque_nm), vibration: Number(payload.engine_vibration), inference_time_ms: 18, confidence: fallbackAnalytics.average_ai_confidence, prediction: "Normal", failure_probability: 0.16 }, { method: "POST", body: JSON.stringify(payload) }),
  streamUrl: () => { if (!API_URL) throw new Error("VITE_API_URL is required for production builds"); return `${API_URL}/stream`; },
  report: async (vehicleId: string) => { if (!API_URL) throw new Error("VITE_API_URL is required for production builds"); const response = await fetch(`${API_URL}/report?vehicle_id=${vehicleId}`); if (!response.ok) throw new Error("Report service unavailable"); return response.blob(); },
};

