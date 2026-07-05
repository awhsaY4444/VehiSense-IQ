import { BrainCircuit, Cloud, Cpu, Database, RadioTower, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { percent } from "@/lib/utils";
import { api } from "@/services/api";
import type { EdgeInference } from "@/types";

const layers = [
  { icon: RadioTower, title: "Vehicle Telemetry", text: "CAN, ECU, battery, thermal, brake, vibration and GPS streams." },
  { icon: Cpu, title: "Edge AI Gateway", text: "Local feature extraction, anomaly scoring, buffering and policy-based sync." },
  { icon: BrainCircuit, title: "Model Services", text: "XGBoost failure classifier, RUL estimator, SHAP explainer and action engine." },
  { icon: Database, title: "Fleet Data Platform", text: "PostgreSQL operational store with model outputs, service events and audit trails." },
  { icon: Cloud, title: "Decision APIs", text: "Predict, RUL, health score, priority, recommendation and report endpoints." },
  { icon: ShieldCheck, title: "Operator Cockpit", text: "Secure SaaS interface for maintenance planning and executive reporting." },
];

export function ArchitecturePage() {
  const [sample, setSample] = useState<EdgeInference | null>(null);

  useEffect(() => {
    let mounted = true;
    let step = 0;
    const tick = () => {
      const wave = Math.sin(step / 2.7);
      const trend = Math.cos(step / 5.1);
      const stress = 0.62 + wave * 0.16 + trend * 0.08;
      step += 1;
      api.edgeInference({
        vehicle_id: "GJ01-DL-2290",
        rotational_speed_rpm: Math.round(1650 - stress * 180 + trend * 34),
        process_temperature_k: Number((309 + stress * 9 + wave * 1.4).toFixed(1)),
        torque_nm: Number((42 + stress * 18 + trend * 2.2).toFixed(1)),
        tool_wear_min: Number((130 + stress * 90 + step * 0.6).toFixed(1)),
        engine_vibration: Number((0.6 + stress * 1.4 + Math.max(0, wave) * 0.12).toFixed(2)),
      }).then((result) => { if (mounted) setSample(result); });
    };
    tick();
    const timer = window.setInterval(tick, 3500);
    return () => { mounted = false; window.clearInterval(timer); };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edge AI Architecture</h1>
        <p className="text-sm text-muted-foreground">A production-oriented flow from vehicle edge telemetry to explainable maintenance decisions.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {layers.map((layer, index) => (
          <Card key={layer.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary"><layer.icon className="h-4 w-4" /></span>
                {index + 1}. {layer.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">{layer.text}</CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>Live Edge Inference Simulation</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm md:grid-cols-4">
            <Metric label="Live RPM" value={sample ? Math.round(sample.rpm).toLocaleString("en-IN") : "--"} />
            <Metric label="Temperature" value={sample ? `${sample.temperature.toFixed(1)} K` : "--"} />
            <Metric label="Torque" value={sample ? `${sample.torque.toFixed(1)} Nm` : "--"} />
            <Metric label="Vibration" value={sample ? sample.vibration.toFixed(2) : "--"} />
            <Metric label="Inference Time" value={sample ? `${sample.inference_time_ms} ms` : "--"} />
            <Metric label="Confidence" value={sample ? percent(sample.confidence) : "--"} />
            <Metric label="Prediction" value={sample ? sample.prediction : "--"} />
            <Metric label="Failure Risk" value={sample ? percent(sample.failure_probability) : "--"} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Deployment Topology</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm md:grid-cols-5">
            {["Sensors", "Edge Gateway", "FastAPI AI Services", "PostgreSQL", "React SaaS Cockpit"].map((item) => (
              <div key={item} className="rounded-lg border bg-secondary/50 p-4 text-center font-medium">{item}</div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border bg-secondary/50 p-4"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 font-semibold">{value}</div></div>;
}

