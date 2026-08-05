"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { FuelLog } from "@/types";

export function FuelTrendChart({ fuelLogs }: { fuelLogs: FuelLog[] }) {
  const sorted = [...fuelLogs].sort((a, b) => a.odometer - b.odometer);
  const data: { label: string; mileage: number }[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const distance = sorted[i].odometer - sorted[i - 1].odometer;
    if (distance > 0 && sorted[i].liters > 0) {
      data.push({
        label: new Date(sorted[i].date).toLocaleDateString("en-US", { day: "2-digit", month: "short" }),
        mileage: Math.round((distance / sorted[i].liters) * 10) / 10,
      });
    }
  }

  if (data.length === 0) {
    return <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">Add at least two fuel logs to see a mileage trend</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis fontSize={11} tickLine={false} axisLine={false} width={40} unit=" km/L" />
        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
        <Line type="monotone" dataKey="mileage" stroke="hsl(var(--accent))" strokeWidth={2.5} dot={{ r: 3 }} name="km/L" />
      </LineChart>
    </ResponsiveContainer>
  );
}
