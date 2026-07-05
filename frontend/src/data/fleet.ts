import type { Recommendation, ShapFeature, Vehicle } from "@/types";

export const fleet: Vehicle[] = [
  { id: "MH12-EV-4018", make: "Tata", model: "Ultra T.16", depot: "Pune North", route: "PNQ-AKL", active: true, healthScore: 92, failureProbability: 0.08, rulDays: 126, priority: "Low", status: "Operational", lastServiceDate: "2026-06-03", mileageKm: 148220, engineHours: 5190, revenuePerDay: 42000 },
  { id: "KA05-HY-7781", make: "Ashok Leyland", model: "Boss 1415", depot: "Bengaluru East", route: "BLR-MYS", active: true, healthScore: 68, failureProbability: 0.31, rulDays: 39, priority: "Medium", status: "Inspection due", lastServiceDate: "2026-05-17", mileageKm: 213804, engineHours: 7418, revenuePerDay: 38000 },
  { id: "GJ01-DL-2290", make: "Eicher", model: "Pro 3019", depot: "Ahmedabad", route: "AMD-SRT", active: true, healthScore: 41, failureProbability: 0.72, rulDays: 9, priority: "Critical", status: "At risk", lastServiceDate: "2026-04-29", mileageKm: 302911, engineHours: 10940, revenuePerDay: 51000 },
  { id: "TN09-FL-1176", make: "Tata", model: "Prima 5530.S", depot: "Chennai Port", route: "MAA-BLR", active: true, healthScore: 55, failureProbability: 0.49, rulDays: 21, priority: "High", status: "Service scheduled", lastServiceDate: "2026-05-06", mileageKm: 267455, engineHours: 9361, revenuePerDay: 58000 },
  { id: "DL10-IC-8802", make: "BharatBenz", model: "1617R", depot: "Delhi NCR", route: "DEL-JAI", active: false, healthScore: 36, failureProbability: 0.81, rulDays: 5, priority: "Critical", status: "At risk", lastServiceDate: "2026-04-14", mileageKm: 338912, engineHours: 12120, revenuePerDay: 47000 },
  { id: "MH14-CV-6388", make: "Mahindra", model: "Blazo X 28", depot: "Pune South", route: "PNQ-NAG", active: true, healthScore: 77, failureProbability: 0.21, rulDays: 72, priority: "Medium", status: "Operational", lastServiceDate: "2026-06-12", mileageKm: 184902, engineHours: 6120, revenuePerDay: 45000 },
  { id: "RJ14-TR-5029", make: "Tata", model: "Signa 4825.TK", depot: "Jaipur", route: "JAI-DEL", active: true, healthScore: 84, failureProbability: 0.14, rulDays: 94, priority: "Low", status: "Operational", lastServiceDate: "2026-06-18", mileageKm: 165778, engineHours: 5844, revenuePerDay: 49000 },
  { id: "TS08-MX-3419", make: "Eicher", model: "Pro 2059", depot: "Hyderabad", route: "HYD-VJA", active: true, healthScore: 62, failureProbability: 0.38, rulDays: 31, priority: "High", status: "Inspection due", lastServiceDate: "2026-05-23", mileageKm: 236410, engineHours: 8018, revenuePerDay: 36000 },
];


export const shapFeatures: ShapFeature[] = [
  { feature: "Engine vibration RMS", value: 57, contribution: 0.24, direction: "risk" },
  { feature: "Coolant temperature", value: 98, contribution: 0.18, direction: "risk" },
  { feature: "Brake pressure variance", value: 11.4, contribution: 0.13, direction: "risk" },
  { feature: "Recent service quality", value: 0.91, contribution: -0.09, direction: "protective" },
  { feature: "Route load index", value: 0.77, contribution: 0.08, direction: "risk" },
];

export const recommendations: Recommendation[] = fleet.map((vehicle) => {
  const critical = vehicle.priority === "Critical";
  return {
    vehicleId: vehicle.id,
    action: critical ? "Immediate repair" : vehicle.priority === "High" ? "Replace part" : vehicle.priority === "Medium" ? "Schedule inspection" : "Continue operation",
    component: critical ? "Cooling pump assembly" : vehicle.priority === "High" ? "Brake actuator" : vehicle.priority === "Medium" ? "Drivetrain sensor cluster" : "No immediate component",
    estimatedRepairCost: critical ? 145000 : vehicle.priority === "High" ? 82000 : vehicle.priority === "Medium" ? 28000 : 6000,
    estimatedDowntimeHours: critical ? 18 : vehicle.priority === "High" ? 9 : vehicle.priority === "Medium" ? 3 : 0.5,
    riskLevel: vehicle.priority,
    rationale: critical ? "Thermal and vibration patterns indicate accelerated degradation within the next duty cycle." : "Recommendation balances predicted failure risk against planned route revenue and service capacity.",
  };
});

