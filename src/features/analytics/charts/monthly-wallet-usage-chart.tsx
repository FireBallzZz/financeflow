"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { Transaction, Wallet } from "@/types";
import { CHART_PALETTE } from "@/lib/constants";
import { formatCurrencyCompact } from "@/lib/format";
import { isTransfer } from "@/lib/utils";

/** Total transaction volume (income + expense, excluding transfers) per wallet, per month. */
export function MonthlyWalletUsageChart({ transactions, wallets, months = 6 }: { transactions: Transaction[]; wallets: Wallet[]; months?: number }) {
  const now = new Date();
  const buckets = Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1) + i, 1);
    return { label: d.toLocaleDateString("en-US", { month: "short" }), year: d.getFullYear(), month: d.getMonth() };
  });
  const activeWallets = wallets.slice(0, 6); // keep the chart legible

  const data = buckets.map((b) => {
    const row: Record<string, string | number> = { name: b.label };
    for (const w of activeWallets) {
      const volume = transactions
        .filter((t) => t.walletId === w.id && !isTransfer(t) && new Date(t.date).getFullYear() === b.year && new Date(t.date).getMonth() === b.month)
        .reduce((s, t) => s + t.amount, 0);
      row[w.name] = volume;
    }
    return row;
  });

  if (activeWallets.length === 0) {
    return <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">No wallets yet</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data}>
        <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrencyCompact(v)} width={56} />
        <Tooltip formatter={(v: number) => formatCurrencyCompact(v)} contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {activeWallets.map((w, i) => (
          <Bar key={w.id} dataKey={w.name} stackId="usage" fill={CHART_PALETTE[i % CHART_PALETTE.length]} radius={i === activeWallets.length - 1 ? [4, 4, 0, 0] : undefined} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
