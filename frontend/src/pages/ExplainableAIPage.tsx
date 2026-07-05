import { BrainCircuit } from "lucide-react";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { percent } from "@/lib/utils";
import { api } from "@/services/api";
import type { ExplanationResponse, ShapFeature, Vehicle } from "@/types";

export function ExplainableAIPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [features, setFeatures] = useState<ShapFeature[]>([]);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.fleet().then((rows) => {
      setVehicles(rows);
      const selected = [...rows].sort((a, b) => b.failureProbability - a.failureProbability)[0];
      if (!selected) { setLoading(false); return; }
      Promise.all([api.shap(selected.id), api.explanation(selected.id), api.predict(selected.id)]).then(([shapRows, explanationRow, prediction]) => {
        setFeatures(shapRows);
        setExplanation(explanationRow);
        setConfidence(prediction.confidence);
        setLoading(false);
      });
    }).catch(() => setLoading(false));
  }, []);

  const vehicle = [...vehicles].sort((a, b) => b.failureProbability - a.failureProbability)[0];
  const chartData = features.map((item) => ({ ...item, abs: Math.abs(item.contribution) }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Explainable AI</h1>
        <p className="text-sm text-muted-foreground">Real SHAP model reasoning for {vehicle?.id ?? "the selected vehicle"} and comparable duty cycles.</p>
      </div>
      {loading && <div className="h-2 w-full overflow-hidden rounded bg-secondary"><div className="h-full w-1/3 animate-pulse rounded bg-primary" /></div>}
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader><CardTitle>Top Contributing Features</CardTitle></CardHeader>
          <CardContent className="h-96">
            {chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">SHAP explanation is loading.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 60, right: 10 }}>
                  <CartesianGrid className="chart-grid" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="feature" width={150} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                  <Bar dataKey="contribution" radius={[0, 6, 6, 0]}>
                    {chartData.map((item) => <Cell key={item.feature} fill={item.direction === "risk" ? "#dc2626" : "#16a34a"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BrainCircuit className="h-4 w-4 text-primary" /> Reason for Prediction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-sm">
            <p className="leading-6 text-muted-foreground">
              XGBoost estimates {vehicle ? percent(vehicle.failureProbability) : "--"} failure probability. The SHAP contributors below show which live sensor features are increasing or reducing the predicted maintenance risk.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-4"><div className="text-xs text-muted-foreground">Confidence</div><div className="mt-1 text-2xl font-semibold">{confidence === null ? "--" : percent(confidence)}</div></div>
              <div className="rounded-lg border p-4"><div className="text-xs text-muted-foreground">Historical comparison</div><div className="mt-1 text-2xl font-semibold">Top {vehicle ? Math.max(3, Math.round(vehicle.failureProbability * 12)) : "--"}%</div></div>
            </div>
            <div className="space-y-3">
              {features.map((item) => (
                <div key={item.feature} className="flex items-center justify-between border-b pb-2">
                  <span className="text-muted-foreground">{item.feature}</span>
                  <span className={item.direction === "risk" ? "text-red-600 dark:text-red-300" : "text-emerald-600 dark:text-emerald-300"}>{item.contribution > 0 ? "+" : ""}{item.contribution.toFixed(3)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      {explanation && (
        <Card>
          <CardHeader><CardTitle>AI Explanation</CardTitle></CardHeader>
          <CardContent className="grid gap-4 text-sm xl:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="text-base font-semibold">{explanation.headline}</div>
              <p className="mt-2 leading-6 text-muted-foreground">{explanation.explanation}</p>
            </div>
            <div className="space-y-2">
              {explanation.evidence.map((item) => <div key={item} className="rounded-md border bg-secondary/40 p-3">{item}</div>)}
              <div className="rounded-md border border-primary/30 bg-primary/10 p-3 font-medium text-primary">{explanation.recommended_next_step}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
