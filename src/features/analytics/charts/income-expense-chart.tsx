"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { Transaction } from "@/types";
import { formatCurrencyCompact } from "@/lib/format";
import { isTransfer } from "@/lib/utils";

export function IncomeExpenseChart({ transactions, months = 6 }: { transactions: Transaction[]; months?: number }) {
  const now = new Date();
  const buckets = Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1) + i, 1);
    return { label: d.toLocaleDateString("en-US", { month: "short" }), year: d.getFullYear(), month: d.getMonth() };
  });

  const data = buckets.map((b) => {
    const income = transactions
      .filter((t) => t.type === "income" && !isTransfer(t) && new Date(t.date).getFullYear() === b.year && new Date(t.date).getMonth() === b.month)
      .reduce((s, t) => s + t.amount, 0);
    const expense = transactions
      .filter((t) => t.type === "expense" && !isTransfer(t) && new Date(t.date).getFullYear() === b.year && new Date(t.date).getMonth() === b.month)
      .reduce((s, t) => s + t.amount, 0);
    return { name: b.label, Income: income, Expense: expense };
  });

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrencyCompact(v)} width={56} />
        <Tooltip
          formatter={(v: number) => formatCurrencyCompact(v)}
          contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }}
        />
        <Bar dataKey="Income" fill="hsl(var(--income))" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Expense" fill="hsl(var(--expense))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
