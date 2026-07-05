import { Activity, Cpu, Database, Gauge } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { percent } from "@/lib/utils";
import { api } from "@/services/api";
import type { ForecastPoint, ModelMonitoring } from "@/types";

export function MonitoringPage() {
  const [monitoring, setMonitoring] = useState<ModelMonitoring | null>(null);
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);

  useEffect(() => {
    const load = () => { api.monitoring().then(setMonitoring); api.forecast().then(setForecast); };
    load();
    const timer = window.setInterval(load, 5000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold">Model Monitoring</h1><p className="text-sm text-muted-foreground">Production signals for drift, confidence, latency, model health, and failure forecast.</p></div>
      <div className="grid gap-4 md:grid-cols-4">
        <Metric icon={Gauge} label="Prediction drift" value={monitoring ? percent(monitoring.prediction_drift) : "--"} />
        <Metric icon={Activity} label="Feature drift" value={monitoring ? percent(monitoring.feature_drift) : "--"} />
        <Metric icon={Cpu} label="Latency" value={monitoring ? `${monitoring.average_inference_latency_ms} ms` : "--"} />
        <Metric icon={Database} label="Predictions" value={monitoring ? monitoring.prediction_count.toLocaleString("en-IN") : "--"} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card><CardHeader><CardTitle>Runtime Health</CardTitle></CardHeader><CardContent className="grid gap-3 text-sm md:grid-cols-2"><Cell label="Average confidence" value={monitoring ? percent(monitoring.average_confidence) : "--"} /><Cell label="Model accuracy" value={monitoring ? percent(monitoring.model_accuracy) : "--"} /><Cell label="CPU usage" value={monitoring ? `${monitoring.cpu_usage_pct}%` : "--"} /><Cell label="Memory usage" value={monitoring ? `${monitoring.memory_usage_pct}%` : "--"} /><Cell label="Model version" value={monitoring?.model_version || "--"} /><Cell label="Cloud sync" value={monitoring?.cloud_sync_status || "--"} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Failure Trend Forecast</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-3">{forecast.map((point) => <div key={point.horizon} className="rounded-lg border p-4"><div className="text-xs text-muted-foreground">{point.horizon}</div><div className="mt-2 text-3xl font-semibold">{point.expected_failures}</div><div className="mt-1 text-sm text-muted-foreground">{percent(point.confidence)} confidence</div></div>)}</CardContent></Card>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Gauge; label: string; value: string }) { return <Card><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-muted-foreground">{label}</CardTitle><Icon className="h-4 w-4 text-primary" /></CardHeader><CardContent><div className="text-2xl font-semibold">{value}</div></CardContent></Card>; }
function Cell({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border p-4"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 font-semibold">{value}</div></div>; }
