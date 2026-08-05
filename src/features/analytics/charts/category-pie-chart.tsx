"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { Transaction } from "@/types";
import { DEFAULT_EXPENSE_CATEGORIES, CHART_PALETTE } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { isTransfer } from "@/lib/utils";

export function CategoryPieChart({ transactions }: { transactions: Transaction[] }) {
  const expenses = transactions.filter((t) => t.type === "expense" && !isTransfer(t));
  const totals = new Map<string, number>();
  expenses.forEach((t) => totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount));
  const data = Array.from(totals.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">No expense data yet</div>;
  }

  const colorFor = (name: string, i: number) =>
    DEFAULT_EXPENSE_CATEGORIES.find((c) => c.name === name)?.color ?? CHART_PALETTE[i % CHART_PALETTE.length];

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2}>
          {data.map((entry, i) => <Cell key={entry.name} fill={colorFor(entry.name, i)} />)}
        </Pie>
        <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
