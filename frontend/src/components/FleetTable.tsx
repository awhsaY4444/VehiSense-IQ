import { ArrowDownUp, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { percent } from "@/lib/utils";
import type { Priority, Vehicle } from "@/types";

const priorities: Array<Priority | "All"> = ["All", "Critical", "High", "Medium", "Low"];

export function FleetTable({ vehicles }: { vehicles: Vehicle[] }) {
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState<Priority | "All">("All");
  const [sort, setSort] = useState<"healthScore" | "failureProbability" | "rulDays">("failureProbability");

  const rows = useMemo(() => {
    return vehicles
      .filter((vehicle) => `${vehicle.id} ${vehicle.depot} ${vehicle.route}`.toLowerCase().includes(query.toLowerCase()))
      .filter((vehicle) => priority === "All" || vehicle.priority === priority)
      .sort((a, b) => sort === "healthScore" || sort === "rulDays" ? a[sort] - b[sort] : b[sort] - a[sort]);
  }, [priority, query, sort, vehicles]);

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search vehicle, depot or route" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {priorities.map((item) => (
            <Button key={item} variant={priority === item ? "default" : "outline"} size="sm" onClick={() => setPriority(item)}>
              {item}
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={() => setSort(sort === "failureProbability" ? "healthScore" : sort === "healthScore" ? "rulDays" : "failureProbability")}>
            <ArrowDownUp className="h-4 w-4" /> Sort
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-secondary/70 text-xs uppercase text-muted-foreground">
            <tr>
              {["Vehicle ID", "Health Score", "Failure Probability", "Remaining Useful Life", "Priority", "Status", "Last Service Date"].map((heading) => (
                <th key={heading} className="px-4 py-3 font-medium">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((vehicle) => (
              <tr key={vehicle.id} className="border-t transition hover:bg-secondary/40">
                <td className="px-4 py-3 font-medium"><Link to={`/fleet/${vehicle.id}`} className="text-primary hover:underline">{vehicle.id}</Link></td>
                <td className="px-4 py-3">{vehicle.healthScore}/100</td>
                <td className="px-4 py-3">{percent(vehicle.failureProbability)}</td>
                <td className="px-4 py-3">{vehicle.rulDays} days</td>
                <td className="px-4 py-3"><Badge>{vehicle.priority}</Badge></td>
                <td className="px-4 py-3 text-muted-foreground">{vehicle.status}</td>
                <td className="px-4 py-3 text-muted-foreground">{vehicle.lastServiceDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
