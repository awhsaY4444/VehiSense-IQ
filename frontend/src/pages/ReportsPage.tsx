import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { currency, percent } from "@/lib/utils";
import { api } from "@/services/api";
import type { Recommendation, Vehicle } from "@/types";

export function ReportsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [items, setItems] = useState<Recommendation[]>([]);
  const vehicle = [...vehicles].sort((a, b) => b.failureProbability - a.failureProbability)[0];
  const recommendation = vehicle ? items.find((item) => item.vehicleId === vehicle.id) : undefined;

  useEffect(() => {
    api.fleet().then(setVehicles).catch(() => setVehicles([]));
    api.recommendations().then(setItems).catch(() => setItems([]));
  }, []);

  async function downloadPdf() {
    if (!vehicle) return;
    const blob = await api.report(vehicle.id);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${vehicle.id}-vehisense-ml-report.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Report Generator</h1>
        <p className="text-sm text-muted-foreground">Generate a downloadable PDF containing vehicle health, prediction, explanation, recommendation, and priority.</p>
      </div>
      <Card className="max-w-3xl">
        <CardHeader><CardTitle>{vehicle ? `${vehicle.id} maintenance decision report` : "Maintenance decision report"}</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          {!vehicle || !recommendation ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Report data is loading from backend inference.</div>
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                <Preview label="Vehicle Health" value={`${vehicle.healthScore}/100`} />
                <Preview label="Prediction" value={percent(vehicle.failureProbability)} />
                <Preview label="Explanation" value="Real SHAP sensor contributors" />
                <Preview label="Recommendation" value={recommendation.action} />
                <Preview label="Priority" value={vehicle.priority} />
                <Preview label="Estimated Cost" value={currency(recommendation.estimatedRepairCost)} />
              </div>
              <Button onClick={downloadPdf}><Download className="h-4 w-4" /> Download PDF</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Preview({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border p-4"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 font-semibold">{value}</div></div>;
}
