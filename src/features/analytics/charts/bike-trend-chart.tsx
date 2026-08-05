"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { FuelLog, MaintenanceLog } from "@/types";
import { formatCurrencyCompact } from "@/lib/format";

export function BikeTrendChart({ fuelLogs, maintenanceLogs, months = 6 }: { fuelLogs: FuelLog[]; maintenanceLogs: MaintenanceLog[]; months?: number }) {
  const now = new Date();
  const buckets = Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1) + i, 1);
    return { label: d.toLocaleDateString("en-US", { month: "short" }), year: d.getFullYear(), month: d.getMonth() };
  });

  const data = buckets.map((b) => {
    const fuel = fuelLogs.filter((f) => new Date(f.date).getFullYear() === b.year && new Date(f.date).getMonth() === b.month).reduce((s, f) => s + f.amount, 0);
    const maint = maintenanceLogs.filter((m) => new Date(m.date).getFullYear() === b.year && new Date(m.date).getMonth() === b.month).reduce((s, m) => s + m.amount, 0);
    return { name: b.label, Total: fuel + maint };
  });

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrencyCompact(v)} width={56} />
        <Tooltip formatter={(v: number) => formatCurrencyCompact(v)} contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
        <Line type="monotone" dataKey="Total" stroke="hsl(var(--bike))" strokeWidth={2.5} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
