"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { Transaction, Wallet } from "@/types";
import { CHART_PALETTE } from "@/lib/constants";
import { formatCurrencyCompact } from "@/lib/format";
import { isTransfer } from "@/lib/utils";

export function WalletBarChart({ transactions, wallets }: { transactions: Transaction[]; wallets: Wallet[] }) {
  const expenses = transactions.filter((t) => t.type === "expense" && !isTransfer(t));
  const totals = new Map<number, number>();
  expenses.forEach((t) => totals.set(t.walletId, (totals.get(t.walletId) ?? 0) + t.amount));
  const data = Array.from(totals.entries())
    .map(([walletId, value]) => ({ name: wallets.find((w) => w.id === walletId)?.name ?? "—", value }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">No expense data yet</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrencyCompact(v)} width={56} />
        <Tooltip formatter={(v: number) => formatCurrencyCompact(v)} contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
