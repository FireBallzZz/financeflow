"use client";
import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import * as Icons from "lucide-react";
import { db } from "@/db/schema";
import type { DateRangePreset } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Chip } from "@/components/ui/chip";
import { generateInsights } from "@/features/insights/insights-engine";
import { isTransfer } from "@/lib/utils";
import { IncomeExpenseChart } from "./charts/income-expense-chart";
import { CategoryPieChart } from "./charts/category-pie-chart";
import { WalletBarChart } from "./charts/wallet-bar-chart";
import { IncomeByWalletChart } from "./charts/income-by-wallet-chart";
import { WalletDistributionChart } from "./charts/wallet-distribution-chart";
import { MonthlyWalletUsageChart } from "./charts/monthly-wallet-usage-chart";
import { BikeTrendChart } from "./charts/bike-trend-chart";
import { FuelTrendChart } from "./charts/fuel-trend-chart";
import { LoanSummaryChart } from "./charts/loan-summary-chart";

const PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
  { value: "year", label: "Yearly" },
  { value: "custom", label: "Custom" },
];

function rangeForPreset(preset: DateRangePreset, customFrom?: string, customTo?: string) {
  const now = new Date();
  if (preset === "week") {
    const from = new Date(now);
    from.setDate(now.getDate() - 7);
    return { from, to: now };
  }
  if (preset === "month") {
    return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
  }
  if (preset === "year") {
    return { from: new Date(now.getFullYear(), 0, 1), to: now };
  }
  return {
    from: customFrom ? new Date(customFrom) : new Date(now.getFullYear(), now.getMonth(), 1),
    to: customTo ? new Date(customTo) : now,
  };
}

export function AnalyticsView() {
  const [preset, setPreset] = useState<DateRangePreset>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const allTransactions = useLiveQuery(() => db.transactions.toArray(), []) ?? [];
  const wallets = useLiveQuery(() => db.wallets.toArray(), []) ?? [];
  const loans = useLiveQuery(() => db.loans.toArray(), []) ?? [];
  const fuelLogs = useLiveQuery(() => db.fuelLogs.toArray(), []) ?? [];
  const maintenanceLogs = useLiveQuery(() => db.maintenanceLogs.toArray(), []) ?? [];
  const budgets = useLiveQuery(() => db.budgets.toArray(), []) ?? [];

  const { from, to } = rangeForPreset(preset, customFrom, customTo);
  const rangedTransactions = useMemo(
    () => allTransactions.filter((t) => { const d = new Date(t.date); return d >= from && d <= to; }),
    [allTransactions, from, to]
  );

  const insights = useMemo(
    () => generateInsights({ transactions: allTransactions, budgets, loans, fuelLogs, maintenanceLogs }),
    [allTransactions, budgets, loans, fuelLogs, maintenanceLogs]
  );

  // Per-wallet computed balance = opening + income - expense + transfersIn - transfersOut,
  // used for the Wallet Balance Distribution chart.
  const walletBalances = useMemo(
    () =>
      wallets.map((w) => {
        const walletTxns = allTransactions.filter((t) => t.walletId === w.id);
        const income = walletTxns.filter((t) => t.type === "income" && !isTransfer(t)).reduce((s, t) => s + t.amount, 0);
        const expense = walletTxns.filter((t) => t.type === "expense" && !isTransfer(t)).reduce((s, t) => s + t.amount, 0);
        const transfersIn = walletTxns.filter((t) => t.type === "income" && isTransfer(t)).reduce((s, t) => s + t.amount, 0);
        const transfersOut = walletTxns.filter((t) => t.type === "expense" && isTransfer(t)).reduce((s, t) => s + t.amount, 0);
        return { wallet: w, balance: w.openingBalance + income - expense + transfersIn - transfersOut };
      }),
    [wallets, allTransactions]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <Chip key={p.value} label={p.label} selected={preset === p.value} onClick={() => setPreset(p.value)} />
        ))}
      </div>
      {preset === "custom" && (
        <div className="grid grid-cols-2 gap-3">
          <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
          <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
        </div>
      )}

      {insights.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Icons.Sparkles className="h-4 w-4 text-primary" /> Insights</CardTitle></CardHeader>
          <CardContent className="space-y-2 pt-0">
            {insights.map((ins) => (
              <div
                key={ins.id}
                className={`flex items-start gap-2 rounded-lg p-2.5 text-sm ${
                  ins.tone === "warning" ? "bg-destructive/10 text-destructive" : ins.tone === "positive" ? "bg-income/10 text-income" : "bg-muted text-foreground"
                }`}
              >
                <Icons.Dot className="mt-0.5 h-4 w-4 shrink-0" />
                {ins.message}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Income vs Expense</CardTitle></CardHeader>
        <CardContent className="pt-0"><IncomeExpenseChart transactions={allTransactions} /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Expense by Category</CardTitle></CardHeader>
        <CardContent className="pt-0"><CategoryPieChart transactions={rangedTransactions} /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Wallet-wise Expenses</CardTitle></CardHeader>
        <CardContent className="pt-0"><WalletBarChart transactions={rangedTransactions} wallets={wallets} /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Income by Wallet</CardTitle></CardHeader>
        <CardContent className="pt-0"><IncomeByWalletChart transactions={rangedTransactions} wallets={wallets} /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Wallet Balance Distribution</CardTitle></CardHeader>
        <CardContent className="pt-0"><WalletDistributionChart balances={walletBalances} /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Monthly Wallet Usage</CardTitle></CardHeader>
        <CardContent className="pt-0"><MonthlyWalletUsageChart transactions={allTransactions} wallets={wallets} /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Bike Expense Trend</CardTitle></CardHeader>
        <CardContent className="pt-0"><BikeTrendChart fuelLogs={fuelLogs} maintenanceLogs={maintenanceLogs} /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Fuel Cost / Mileage Trend</CardTitle></CardHeader>
        <CardContent className="pt-0"><FuelTrendChart fuelLogs={fuelLogs} /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Loan Summary</CardTitle></CardHeader>
        <CardContent className="pt-0"><LoanSummaryChart loans={loans} /></CardContent>
      </Card>
    </div>
  );
}
