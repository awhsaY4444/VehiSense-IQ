import { useEffect, useState } from "react";
import { FleetTable } from "@/components/FleetTable";
import { api } from "@/services/api";
import type { Vehicle } from "@/types";

export function FleetPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    api.fleet().then(setVehicles);
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Fleet Registry</h1>
        <p className="text-sm text-muted-foreground">Search, filter, sort, and drill into each vehicle's maintenance risk profile.</p>
      </div>
      <FleetTable vehicles={vehicles} />
    </div>
  );
}



