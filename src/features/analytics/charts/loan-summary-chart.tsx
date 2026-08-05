"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { Loan } from "@/types";
import { formatCurrencyCompact } from "@/lib/format";

export function LoanSummaryChart({ loans }: { loans: Loan[] }) {
  const given = loans.filter((l) => l.direction === "given").reduce((s, l) => s + (l.amount - l.paidAmount), 0);
  const borrowed = loans.filter((l) => l.direction === "borrowed").reduce((s, l) => s + (l.amount - l.paidAmount), 0);
  const data = [
    { name: "You're Owed", value: given, color: "hsl(var(--income))" },
    { name: "You Owe", value: borrowed, color: "hsl(var(--expense))" },
  ];

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
        <XAxis type="number" hide tickFormatter={(v) => formatCurrencyCompact(v)} />
        <YAxis type="category" dataKey="name" fontSize={12} tickLine={false} axisLine={false} width={90} />
        <Tooltip formatter={(v: number) => formatCurrencyCompact(v)} contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
          {data.map((d) => <Cell key={d.name} fill={d.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
