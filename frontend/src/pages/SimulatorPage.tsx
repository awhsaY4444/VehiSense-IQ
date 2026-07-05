import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/services/api";
import type { Vehicle } from "@/types";
import { currency } from "@/lib/utils";

export function SimulatorPage() {
  const [days, setDays] = useState(12);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    api.fleet().then(setVehicles).catch(() => setVehicles([]));
  }, []);

  const vehicle = useMemo(
    () => [...vehicles].sort((a, b) => b.failureProbability - a.failureProbability)[0],
    [vehicles],
  );

  const simulation = useMemo(() => {
    if (!vehicle) return null;

    const urgency = Math.max(0.35, vehicle.failureProbability);
    const repairToday = Math.round(85000 + urgency * 95000 + Math.max(0, 20 - vehicle.rulDays) * 1800);
    const baseDowntime = Math.max(8, Math.round(10 + urgency * 14));
    const riskIncrease = Math.min(0.5, days / Math.max(vehicle.rulDays, 1) * 0.35);
    const risk = Math.min(0.98, vehicle.failureProbability + riskIncrease);
    const repairLater = Math.round(repairToday * (1 + riskIncrease * 1.8 + days * 0.015));
    const downtime = Math.round(baseDowntime + days * (0.55 + urgency));
    const revenueLossToday = baseDowntime * (vehicle.revenuePerDay / 12);
    const revenueLoss = downtime * (vehicle.revenuePerDay / 12);

    return { repairToday, repairLater, baseDowntime, downtime, revenueLossToday, revenueLoss, risk, currentRisk: vehicle.failureProbability };
  }, [days, vehicle]);

  if (!vehicle || !simulation) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Cost Impact Simulator</h1>
          <p className="text-sm text-muted-foreground">Compare immediate repair with delayed intervention.</p>
        </div>
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Cost simulation data is loading.</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Cost Impact Simulator</h1>
        <p className="text-sm text-muted-foreground">Compare immediate repair with delayed intervention for {vehicle.id}.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Repair timing</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 md:grid-cols-[1fr_120px] md:items-center">
            <input aria-label="Delay days" type="range" min="0" max="30" value={days} onChange={(event) => setDays(Number(event.target.value))} className="h-2 w-full accent-primary" />
            <div className="rounded-lg border bg-secondary px-4 py-3 text-center text-sm font-semibold">{days} days</div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="shadow-none">
              <CardHeader><CardTitle>Repair Today</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Metric label="Repair Cost" value={currency(simulation.repairToday)} />
                <Metric label="Downtime" value={`${simulation.baseDowntime}h`} />
                <Metric label="Revenue Loss" value={currency(simulation.revenueLossToday)} />
                <Metric label="Risk" value={`${Math.round(simulation.currentRisk * 100)}%`} />
              </CardContent>
            </Card>
            <Card className="shadow-none">
              <CardHeader><CardTitle>Repair After {days} Days</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Metric label="Repair Cost" value={currency(simulation.repairLater)} />
                <Metric label="Downtime" value={`${simulation.downtime}h`} />
                <Metric label="Revenue Loss" value={currency(simulation.revenueLoss)} />
                <Metric label="Risk" value={`${Math.round(simulation.risk * 100)}%`} />
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 border-b pb-3 last:border-0"><span className="text-muted-foreground">{label}</span><span className="text-right font-semibold">{value}</span></div>;
}
