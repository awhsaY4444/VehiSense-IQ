import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Activity, BarChart3, BrainCircuit, Building2, FileText, Gauge, GitBranch, MonitorCog, Moon, Settings, ShieldCheck, SunMedium, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Command Center", icon: Gauge },
  { to: "/fleet", label: "Fleet", icon: Building2 },
  { to: "/digital-twin", label: "Digital Twin", icon: Activity },
  { to: "/explainable-ai", label: "Explainable AI", icon: BrainCircuit },
  { to: "/priority", label: "Priority Engine", icon: BarChart3 },
  { to: "/recommendations", label: "Recommendations", icon: Wrench },
  { to: "/simulator", label: "Cost Simulator", icon: GitBranch },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/architecture", label: "Edge AI", icon: ShieldCheck },
  { to: "/monitoring", label: "Monitoring", icon: MonitorCog },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell() {
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r bg-card lg:block">
        <div className="flex h-16 items-center border-b px-6">
          <div>
            <div className="text-lg font-semibold">VehiSense IQ</div>
            <div className="text-xs text-muted-foreground">Decision intelligence platform</div>
          </div>
        </div>
        <nav className="space-y-1 px-3 py-5">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn("flex h-10 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground", isActive && "bg-secondary text-foreground")
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur md:px-8">
          <div>
            <div className="text-sm font-medium">Fleet Operations</div>
            <div className="text-xs text-muted-foreground">Live model run: Edge cluster IND-West-04</div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
              {dark ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="outline" onClick={() => { localStorage.removeItem("vehisense:auth"); navigate("/login"); }}>
              Sign out
            </Button>
          </div>
        </header>
        <main className="px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

