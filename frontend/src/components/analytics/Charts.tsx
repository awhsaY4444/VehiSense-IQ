import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const palette = ["#0e7490", "#f59e0b", "#dc2626", "#16a34a", "#2563eb"];

type TrendDatum = { label: string; score: number; downtime: number; cost: number; failures: number };
type DistributionDatum = { name: string; value: number };

export function TrendCard({ title, data, dataKey, suffix = "" }: { title: string; data: TrendDatum[]; dataKey: "score" | "downtime" | "cost" | "failures"; suffix?: string }) {
  return (
    <Card className="transition hover:shadow-panel">
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="h-64">
        {data.length === 0 ? <EmptyChart /> : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ left: -22, right: 10, top: 10, bottom: 0 }}>
              <CartesianGrid className="chart-grid" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "currentColor" }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "currentColor" }} />
              <Tooltip formatter={(value) => `${value}${suffix}`} contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              <Line type="monotone" dataKey={dataKey} stroke="#0e7490" strokeWidth={2.5} dot={false} isAnimationActive />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function FailureDistributionChart({ data }: { data: DistributionDatum[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return (
    <Card className="transition hover:shadow-panel">
      <CardHeader><CardTitle>Failure Distribution</CardTitle></CardHeader>
      <CardContent className="grid h-64 grid-cols-1 items-center gap-4 md:grid-cols-[1fr_160px]">
        {total === 0 ? <EmptyChart /> : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={48} outerRadius={82} paddingAngle={2} isAnimationActive>
                  {data.map((_, index) => <Cell key={index} fill={palette[index % palette.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {data.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: palette[index] }} />{item.name}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function PriorityBarChart({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ left: -20, right: 10, top: 10 }}>
        <CartesianGrid className="chart-grid" vertical={false} />
        <XAxis dataKey="name" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#0e7490" isAnimationActive />
      </BarChart>
    </ResponsiveContainer>
  );
}

function EmptyChart() {
  return <div className="flex h-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">Waiting for live fleet data</div>;
}
