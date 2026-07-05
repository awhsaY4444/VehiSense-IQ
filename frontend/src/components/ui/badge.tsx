import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  Critical: "border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300",
  High: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  Medium: "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  Low: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
};

export function Badge({ children, className }: { children: string; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-sm border px-2 py-1 text-xs font-medium", styles[children] ?? "bg-secondary text-secondary-foreground", className)}>{children}</span>;
}
