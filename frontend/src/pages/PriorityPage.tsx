import { useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/services/api";
import type { Vehicle } from "@/types";
import { currency } from "@/lib/utils";

export function PriorityPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    api.fleet().then(setVehicles).catch(() => setVehicles([]));
  }, []);

  const ranked = useMemo(
    () => [...vehicles].sort((a, b) => b.failureProbability * b.revenuePerDay - a.failureProbability * a.revenuePerDay),
    [vehicles],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Maintenance Priority Engine</h1>
        <p className="text-sm text-muted-foreground">Ranked by risk, RUL, route revenue, depot service capacity, and predicted downtime exposure.</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> Ranked Service Queue</CardTitle></CardHeader>
        <CardContent>
          {ranked.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Fleet priority data is loading.</div>
          ) : (
            <div className="divide-y">
              {ranked.map((vehicle, index) => {
                const impact = vehicle.failureProbability * vehicle.revenuePerDay * Math.max(2, 10 - vehicle.rulDays / 10);
                return (
                  <div key={vehicle.id} className="grid gap-3 py-4 text-sm md:grid-cols-[48px_1fr_120px_120px_160px_140px] md:items-center">
                    <span className="text-lg font-semibold text-muted-foreground">#{index + 1}</span>
                    <div><div className="font-medium">{vehicle.id}</div><div className="text-muted-foreground">{vehicle.depot} - {vehicle.route}</div></div>
                    <span>{vehicle.rulDays} days RUL</span>
                    <span>{Math.round(vehicle.failureProbability * 100)}% risk</span>
                    <span>{currency(impact)} impact</span>
                    <Badge>{vehicle.priority}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
