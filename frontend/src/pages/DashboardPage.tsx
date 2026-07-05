import { AlertTriangle, Clock, IndianRupee, ShieldCheck, Truck, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FailureDistributionChart, TrendCard } from "@/components/analytics/Charts";
import { FleetTable } from "@/components/FleetTable";
import { MetricCard } from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/services/api";
import { currency, percent } from "@/lib/utils";
import type { Alert, FleetAnalytics, Recommendation, StreamPayload, Vehicle } from "@/types";

function deriveAnalytics(vehicles: Vehicle[], recommendations: Recommendation[]): FleetAnalytics | null {
  if (vehicles.length === 0) return null;
  const count = vehicles.length;
  const critical = vehicles.filter((vehicle) => vehicle.priority === "Critical").length;
  const upcoming = vehicles.filter((vehicle) => vehicle.failureProbability >= 0.5 || vehicle.rulDays <= 10 || ["Critical", "High"].includes(vehicle.priority)).length;
  const plannedCost = recommendations.reduce((sum, item) => sum + item.estimatedRepairCost, 0);
  const reactiveCost = recommendations.reduce((sum, item) => {
    const vehicle = vehicles.find((row) => row.id === item.vehicleId);
    if (!vehicle) return sum;
    return sum + item.estimatedRepairCost * (1 + vehicle.failureProbability * 0.75 + Math.max(0, 14 - vehicle.rulDays) * 0.045);
  }, 0);
  const avoidedHours = vehicles.reduce((sum, vehicle) => {
    const recommendation = recommendations.find((item) => item.vehicleId === vehicle.id);
    if (!recommendation || !(vehicle.priority === "Critical" || vehicle.priority === "High" || vehicle.rulDays <= 10)) return sum;
    const delayedDowntime = recommendation.estimatedDowntimeHours + Math.max(2, (14 - Math.min(vehicle.rulDays, 14)) * 1.35) + vehicle.failureProbability * 10;
    return sum + Math.max(0, delayedDowntime - recommendation.estimatedDowntimeHours);
  }, 0);
  return {
    fleet_availability: Number((1 - critical / count).toFixed(3)),
    average_health: Number((vehicles.reduce((sum, vehicle) => sum + vehicle.healthScore, 0) / count).toFixed(1)),
    average_rul: Number((vehicles.reduce((sum, vehicle) => sum + vehicle.rulDays, 0) / count).toFixed(1)),
    predicted_monthly_failures: upcoming,
    maintenance_cost_saved: Math.max(0, Math.round(reactiveCost - plannedCost)),
    downtime_avoided_hours: Number(avoidedHours.toFixed(1)),
    average_ai_confidence: Number((vehicles.reduce((sum, vehicle) => sum + Math.max(0.55, Math.min(0.96, 1 - vehicle.failureProbability * 0.35)), 0) / count).toFixed(2)),
  };
}

function isZeroAnalyticsInvalid(analytics: FleetAnalytics | null, vehicles: Vehicle[]): boolean {
  if (!analytics || vehicles.length === 0) return false;
  const riskyVehicles = vehicles.some((vehicle) => vehicle.priority === "Critical" || vehicle.failureProbability >= 0.5 || vehicle.rulDays <= 10);
  return riskyVehicles && (analytics.average_health <= 0 || analytics.average_ai_confidence <= 0 || analytics.predicted_monthly_failures <= 0 || analytics.downtime_avoided_hours <= 0 || analytics.maintenance_cost_saved <= 0);
}

export function DashboardPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [analytics, setAnalytics] = useState<FleetAnalytics | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  useEffect(() => {
    api.fleet().then(setVehicles);
    api.alerts().then(setAlerts);
    api.analytics().then(setAnalytics);
    api.recommendations().then(setRecommendations);
    const source = new EventSource(api.streamUrl());
    source.onmessage = (event) => {
      const payload = JSON.parse(event.data) as StreamPayload;
      setVehicles(payload.fleet);
      setAlerts(payload.alerts);
      setAnalytics(payload.analytics);
      api.recommendations().then(setRecommendations);
    };
    return () => source.close();
  }, []);

  const derivedAnalytics = useMemo(() => deriveAnalytics(vehicles, recommendations), [vehicles, recommendations]);
  const effectiveAnalytics = isZeroAnalyticsInvalid(analytics, vehicles) ? derivedAnalytics : analytics ?? derivedAnalytics;
  const active = vehicles.filter((vehicle) => vehicle.active).length;
  const critical = vehicles.filter((vehicle) => vehicle.priority === "Critical").length;
  const avgHealth = effectiveAnalytics?.average_health ?? 0;
  const recommendationByVehicle = new Map(recommendations.map((item) => [item.vehicleId, item]));
  const upcomingFailures = effectiveAnalytics?.predicted_monthly_failures ?? 0;
  const downtimeAvoided = effectiveAnalytics?.downtime_avoided_hours ?? 0;
  const costSaved = effectiveAnalytics?.maintenance_cost_saved ?? 0;
  const chartData = vehicles.map((vehicle) => {
    const recommendation = recommendationByVehicle.get(vehicle.id);
    return {
      label: vehicle.id.slice(0, 5),
      score: vehicle.healthScore,
      downtime: Math.round(recommendation?.estimatedDowntimeHours ?? Math.max(1, vehicle.failureProbability * 18)),
      cost: Math.round((recommendation?.estimatedRepairCost ?? vehicle.failureProbability * vehicle.revenuePerDay) / 1000),
      failures: vehicle.failureProbability >= 0.5 || vehicle.rulDays <= 10 ? 1 : 0,
    };
  });
  const distribution = ["Critical", "High", "Medium", "Low"].map((name) => ({ name, value: vehicles.filter((vehicle) => vehicle.priority === name).length }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between"><div><h1 className="text-2xl font-semibold">Fleet Health Command Center</h1><p className="text-sm text-muted-foreground">Decision intelligence across route risk, maintenance capacity, and asset health.</p></div></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard title="Fleet Health Score" value={effectiveAnalytics ? `${Math.round(avgHealth)}/100` : "--"} delta={effectiveAnalytics ? `${percent(effectiveAnalytics.average_ai_confidence)} AI confidence` : "Loading AI confidence"} icon={ShieldCheck} tone="good" />
        <MetricCard title="Active Vehicles" value={`${active}`} delta={`${vehicles.length} registered assets`} icon={Truck} />
        <MetricCard title="Critical Vehicles" value={`${critical}`} delta="Live alert engine" icon={AlertTriangle} tone="bad" />
        <MetricCard title="Upcoming Failures" value={effectiveAnalytics ? `${upcomingFailures}` : "--"} delta="Predicted within 30 days" icon={Wrench} tone="warn" />
        <MetricCard title="Downtime Avoided" value={effectiveAnalytics ? `${downtimeAvoided}h` : "--"} delta="Recommendation impact" icon={Clock} tone="good" />
        <MetricCard title="Cost Saved" value={effectiveAnalytics ? currency(costSaved) : "--"} delta="AI planned maintenance" icon={IndianRupee} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2"><TrendCard title="Fleet Health Trend" data={chartData} dataKey="score" /><FailureDistributionChart data={distribution} /><TrendCard title="Downtime Trend" data={chartData} dataKey="downtime" suffix="h" /><TrendCard title="Cost Trend" data={chartData} dataKey="cost" suffix="k" /></div>
      <Card><CardHeader><CardTitle>Smart Alerts</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-3">{alerts.length === 0 ? <div className="text-sm text-muted-foreground">No active alerts. Live telemetry is being monitored.</div> : alerts.slice(0, 6).map((alert) => <div key={alert.id} className="rounded-lg border p-3 text-sm transition hover:bg-secondary/40"><div className="font-medium">{alert.title}</div><div className="mt-1 text-muted-foreground">{alert.vehicle_id} - {alert.message}</div></div>)}</CardContent></Card>
      <FleetTable vehicles={vehicles} />
    </div>
  );
}
