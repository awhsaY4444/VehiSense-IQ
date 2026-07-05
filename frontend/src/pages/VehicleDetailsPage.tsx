import { CalendarClock, Gauge, LineChart as LineChartIcon, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { percent } from "@/lib/utils";
import { api } from "@/services/api";
import type { MaintenanceEvent, TelemetrySnapshot, Vehicle } from "@/types";

type PredictionSummary = { confidence: number };
type SensorPoint = { label: string; temp: number; vibration: number; pressure: number };

export function VehicleDetailsPage() {
  const { vehicleId } = useParams();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [prediction, setPrediction] = useState<PredictionSummary | null>(null);
  const [history, setHistory] = useState<MaintenanceEvent[]>([]);
  const [sensorTrend, setSensorTrend] = useState<SensorPoint[]>([]);

  useEffect(() => {
    api.fleet().then(setVehicles).catch(() => setVehicles([]));
  }, []);

  const vehicle = useMemo(() => vehicles.find((item) => item.id === vehicleId) ?? vehicles[0], [vehicleId, vehicles]);

  useEffect(() => {
    if (!vehicle) return;
    api.predict(vehicle.id).then((result) => setPrediction(result as PredictionSummary)).catch(() => setPrediction(null));
    api.maintenanceHistory(vehicle.id).then(setHistory).catch(() => setHistory([]));
  }, [vehicle]);

  useEffect(() => {
    if (!vehicle) return;
    let mounted = true;
    const loadTelemetry = () => {
      api.telemetry().then((rows: TelemetrySnapshot[]) => {
        const snapshot = rows.find((item) => item.vehicle_id === vehicle.id);
        if (!snapshot || !mounted) return;
        setSensorTrend((current) => {
          const next = [...current, {
            label: new Date(snapshot.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            temp: snapshot.coolant_temperature_c,
            vibration: Number(snapshot.engine_vibration.toFixed(2)),
            pressure: snapshot.oil_pressure_bar,
          }];
          return next.slice(-8);
        });
      });
    };
    loadTelemetry();
    const timer = window.setInterval(loadTelemetry, 4000);
    return () => { mounted = false; window.clearInterval(timer); };
  }, [vehicle]);

  if (!vehicle) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-semibold">Vehicle Details</h1><p className="text-sm text-muted-foreground">Loading backend vehicle intelligence.</p></div>
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Vehicle data is loading.</CardContent></Card>
      </div>
    );
  }

  const vehicleFacts = [
    { icon: Truck, label: "Model", value: `${vehicle.make} ${vehicle.model}` },
    { icon: Gauge, label: "Mileage", value: `${vehicle.mileageKm.toLocaleString("en-IN")} km` },
    { icon: CalendarClock, label: "Engine Hours", value: `${vehicle.engineHours.toLocaleString("en-IN")} h` },
    { icon: LineChartIcon, label: "Status", value: vehicle.status },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{vehicle.id}</h1>
          <p className="text-sm text-muted-foreground">{vehicle.make} {vehicle.model} - {vehicle.depot} - Route {vehicle.route}</p>
        </div>
        <Badge>{vehicle.priority}</Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader><CardTitle>Health Score</CardTitle></CardHeader><CardContent className="text-3xl font-semibold">{vehicle.healthScore}/100</CardContent></Card>
        <Card><CardHeader><CardTitle>Failure Prediction</CardTitle></CardHeader><CardContent className="text-3xl font-semibold">{percent(vehicle.failureProbability)}</CardContent></Card>
        <Card><CardHeader><CardTitle>Remaining Useful Life</CardTitle></CardHeader><CardContent className="text-3xl font-semibold">{vehicle.rulDays}d</CardContent></Card>
        <Card><CardHeader><CardTitle>Failure Confidence</CardTitle></CardHeader><CardContent className="text-3xl font-semibold">{prediction ? percent(prediction.confidence) : "--"}</CardContent></Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader><CardTitle>Vehicle Information</CardTitle></CardHeader>
          <CardContent className="grid gap-4 text-sm">
            {vehicleFacts.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center justify-between border-b pb-3 last:border-0">
                <span className="flex items-center gap-2 text-muted-foreground"><Icon className="h-4 w-4" />{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Sensor Trends</CardTitle></CardHeader>
          <CardContent className="h-80">
            {sensorTrend.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">Telemetry trend is loading.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sensorTrend} margin={{ left: -18, right: 10 }}>
                  <CartesianGrid className="chart-grid" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                  <Line dataKey="temp" stroke="#dc2626" strokeWidth={2} dot={false} />
                  <Line dataKey="vibration" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <Line dataKey="pressure" stroke="#0e7490" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Maintenance History</CardTitle></CardHeader>
        <CardContent>
          <div className="divide-y">
            {history.map((item) => (
              <div key={`${item.date}-${item.type}`} className="grid gap-2 py-4 text-sm md:grid-cols-[140px_180px_1fr]">
                <span className="text-muted-foreground">{item.date}</span>
                <span className="font-medium">{item.type}</span>
                <span className="text-muted-foreground">{item.parts_replaced.join(", ") || item.technician_notes}</span>
              </div>
            ))}
            {history.length === 0 && <div className="py-6 text-sm text-muted-foreground">Maintenance history is loading.</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
