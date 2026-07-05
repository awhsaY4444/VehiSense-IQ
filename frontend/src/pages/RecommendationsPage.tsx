import { useEffect, useState } from "react";
import { Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/services/api";
import type { Recommendation } from "@/types";
import { currency } from "@/lib/utils";

export function RecommendationsPage() {
  const [items, setItems] = useState<Recommendation[]>([]);

  useEffect(() => {
    api.recommendations().then(setItems).catch(() => setItems([]));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Maintenance Recommendation Engine</h1>
        <p className="text-sm text-muted-foreground">Actionable service guidance tuned for downtime, risk level, and repair economics.</p>
      </div>
      {items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">Maintenance recommendations are loading.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {items.map((item) => (
            <Card key={item.vehicleId}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2"><Wrench className="h-4 w-4 text-primary" /> {item.vehicleId}</span>
                  <Badge>{item.riskLevel}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Action</div><div className="mt-1 font-semibold">{item.action}</div></div>
                  <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Repair cost</div><div className="mt-1 font-semibold">{currency(item.estimatedRepairCost)}</div></div>
                  <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Downtime</div><div className="mt-1 font-semibold">{item.estimatedDowntimeHours}h</div></div>
                </div>
                <div><span className="font-medium">Component:</span> <span className="text-muted-foreground">{item.component}</span></div>
                <p className="leading-6 text-muted-foreground">{item.rationale}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
