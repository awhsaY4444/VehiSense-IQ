import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({ title, value, delta, icon: Icon, tone = "neutral" }: { title: string; value: string; delta: string; icon: LucideIcon; tone?: "neutral" | "good" | "warn" | "bad" }) {
  const tones = {
    neutral: "bg-primary/10 text-primary",
    good: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    warn: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
    bad: "bg-red-500/10 text-red-600 dark:text-red-300",
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-muted-foreground">{title}</CardTitle>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-md", tones[tone])}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{delta}</p>
      </CardContent>
    </Card>
  );
}
