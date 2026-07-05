import { Activity, AlertTriangle, Gauge, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { currency, percent } from "@/lib/utils";
import { api } from "@/services/api";
import type { DigitalTwinVehicle, TimelineEvent } from "@/types";

export function DigitalTwinPage() {
  const [twins, setTwins] = useState<DigitalTwinVehicle[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    const load = () => api.digitalTwin().then((rows) => { setTwins(rows); setSelected((current) => current || rows[0]?.vehicle.id || ""); });
    load();
    const timer = window.setInterval(load, 4000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => { if (selected) api.timeline(selected).then(setTimeline); }, [selected]);

  const active = twins.find((item) => item.vehicle.id === selected) ?? twins[0];

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold">Fleet Digital Twin</h1><p className="text-sm text-muted-foreground">Live vehicle state, telemetry, prediction, RUL, recommendation, alerts, and degradation timeline.</p></div>
      <div className="grid gap-4 xl:grid-cols-4">
        {twins.map((item) => (
          <Card key={item.vehicle.id} onClick={() => setSelected(item.vehicle.id)} className={`cursor-pointer transition ${selected === item.vehicle.id ? "ring-2 ring-primary" : ""}`}>
            <CardHeader><CardTitle className="flex items-center justify-between"><span>{item.vehicle.id}</span><Badge>{item.vehicle.priority}</Badge></CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Health</span><span className="font-semibold">{item.vehicle.healthScore}/100</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Failure risk</span><span className="font-semibold">{percent(item.prediction.failure_probability)}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">RUL</span><span className="font-semibold">{item.rul.rul_days}d</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">RPM</span><span className="font-semibold">{Math.round(item.telemetry.rpm)}</span></div>
            </CardContent>
          </Card>
        ))}
      </div>
      {active && <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> Live Sensors - {active.vehicle.id}</CardTitle></CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-3">
            <Metric label="Coolant" value={`${active.telemetry.coolant_temperature_c} C`} />
            <Metric label="Oil temp" value={`${active.telemetry.oil_temperature_c} C`} />
            <Metric label="Oil pressure" value={`${active.telemetry.oil_pressure_bar} bar`} />
            <Metric label="Fuel pressure" value={`${active.telemetry.fuel_pressure_bar} bar`} />
            <Metric label="Battery" value={`${active.telemetry.battery_voltage} V`} />
            <Metric label="Vibration" value={active.telemetry.engine_vibration.toFixed(3)} />
            <Metric label="Brake wear" value={`${active.telemetry.brake_wear_pct}%`} />
            <Metric label="Tyre pressure" value={`${active.telemetry.tyre_pressure_psi} psi`} />
            <Metric label="Torque" value={`${active.telemetry.torque_nm} Nm`} />
            <Metric label="Engine load" value={`${active.telemetry.engine_load_pct}%`} />
            <Metric label="Weather" value={active.telemetry.weather} />
            <Metric label="Cargo load" value={`${active.telemetry.cargo_load_pct}%`} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Wrench className="h-4 w-4 text-primary" /> Current Recommendation</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3"><Metric label="Action" value={active.recommendation.action} /><Metric label="Cost" value={currency(active.recommendation.estimatedRepairCost)} /><Metric label="Downtime" value={`${active.recommendation.estimatedDowntimeHours}h`} /><Metric label="Confidence" value={percent(active.prediction.confidence)} /></div>
            <p className="leading-6 text-muted-foreground">{active.recommendation.rationale}</p>
            <div className="space-y-2">{active.alerts.map((alert) => <div key={alert.id} className="rounded-md border p-3"><div className="flex items-center gap-2 font-medium"><AlertTriangle className="h-4 w-4 text-amber-500" />{alert.title}</div><p className="mt-1 text-muted-foreground">{alert.message}</p></div>)}</div>
          </CardContent>
        </Card>
      </div>}
      <Card>
        <CardHeader><CardTitle>Predictive Maintenance Timeline</CardTitle></CardHeader>
        <CardContent><div className="grid gap-3 md:grid-cols-5">{timeline.map((event) => <div key={`${event.label}-${event.date}`} className="rounded-lg border p-4 text-sm"><div className="text-xs text-muted-foreground">{event.date}</div><div className="mt-1 font-semibold">{event.label}</div><p className="mt-2 leading-5 text-muted-foreground">{event.description}</p></div>)}</div></CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border bg-secondary/40 p-3"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 font-semibold">{value}</div></div>; }
