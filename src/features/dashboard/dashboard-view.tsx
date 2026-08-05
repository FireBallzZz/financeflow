"use client";
import { useState } from "react";
import Link from "next/link";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/schema";
import { useTotalBalance } from "@/hooks/use-wallets";
import { useRecentTransactions } from "@/hooks/use-transactions";
import { useLoanSummary } from "@/hooks/use-loans";
import { useBikeCosts } from "@/hooks/use-bike";
import { useBudgetProgress } from "@/hooks/use-budgets";
import { useUpcomingReminders } from "@/hooks/use-reminders";
import { formatCurrency, formatCurrencyCompact, formatDateShort, formatRelativeDay, formatTime } from "@/lib/format";
import { isTransfer } from "@/lib/utils";
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from "@/lib/constants";
import { StatCard } from "@/components/shared/stat-card";
import { WalletBalanceCards } from "@/components/shared/wallet-balance-cards";
import { EmptyState } from "@/components/shared/empty-state";
import { ProgressBar } from "@/components/ui/progress-bar";
import { IncomeExpenseChart } from "@/features/analytics/charts/income-expense-chart";
import { CategoryPieChart } from "@/features/analytics/charts/category-pie-chart";
import { TransactionForm } from "@/features/transactions/transaction-form";
import { LoanForm } from "@/features/loans/loan-form";
import { FuelForm } from "@/features/bike/fuel-form";
import type { TransactionType } from "@/types";
import { withAlpha } from "@/lib/utils";

function categoryMeta(name: string, type: "income" | "expense") {
  const list = type === "income" ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;
  return list.find((c) => c.name === name) ?? list[list.length - 1];
}

export function DashboardView() {
  const totalBalance = useTotalBalance();
  const recentTxns = useRecentTransactions(6);
  const allTxns = useLiveQuery(() => db.transactions.toArray(), []) ?? [];
  const wallets = useLiveQuery(() => db.wallets.toArray(), []) ?? [];
  const loanSummary = useLoanSummary();
  const bikeCosts = useBikeCosts();
  const now = new Date();
  const budgetProgress = useBudgetProgress(now.getMonth() + 1, now.getFullYear());
  const reminders = useUpcomingReminders(4);

  const [quickAdd, setQuickAdd] = useState<null | "income" | "expense" | "loan" | "fuel">(null);

  const thisMonthIncome = allTxns
    .filter((t) => t.type === "income" && !isTransfer(t) && new Date(t.date).getMonth() === now.getMonth() && new Date(t.date).getFullYear() === now.getFullYear())
    .reduce((s, t) => s + t.amount, 0);
  const thisMonthExpense = allTxns
    .filter((t) => t.type === "expense" && !isTransfer(t) && new Date(t.date).getMonth() === now.getMonth() && new Date(t.date).getFullYear() === now.getFullYear())
    .reduce((s, t) => s + t.amount, 0);
  const totalIncome = allTxns.filter((t) => t.type === "income" && !isTransfer(t)).reduce((s, t) => s + t.amount, 0);
  const totalExpense = allTxns.filter((t) => t.type === "expense" && !isTransfer(t)).reduce((s, t) => s + t.amount, 0);

  const walletName = (id: number) => wallets.find((w) => w.id === id)?.name ?? "—";

  return (
    <div className="space-y-6">
      {/* Balance hero */}
      <div className="rounded-2xl bg-gradient-to-br from-primary to-violet-600 p-6 text-white shadow-lg shadow-primary/25">
        <p className="text-sm text-white/80">Current Balance</p>
        <p className="mt-1 truncate text-3xl font-bold">{formatCurrency(totalBalance)}</p>
        <div className="mt-5 flex divide-x divide-white/20">
          <div className="min-w-0 flex-1 pr-4">
            <p className="flex items-center gap-1 text-xs text-white/80"><Icons.ArrowDownLeft className="h-3 w-3 shrink-0" /> <span className="min-w-0 truncate">This Month Income</span></p>
            <p className="mt-0.5 truncate text-lg font-bold">{formatCurrencyCompact(thisMonthIncome)}</p>
          </div>
          <div className="min-w-0 flex-1 pl-4">
            <p className="flex items-center gap-1 text-xs text-white/80"><Icons.ArrowUpRight className="h-3 w-3 shrink-0" /> <span className="min-w-0 truncate">This Month Expense</span></p>
            <p className="mt-0.5 truncate text-lg font-bold">{formatCurrencyCompact(thisMonthExpense)}</p>
          </div>
        </div>
      </div>

      <WalletBalanceCards wallets={wallets} />

      {/* Quick actions */}
      <div>
        <p className="mb-2 text-sm font-semibold">Quick Actions</p>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          <QuickAction icon="PlusCircle" label="Income" color="hsl(var(--income))" onClick={() => setQuickAdd("income")} />
          <QuickAction icon="MinusCircle" label="Expense" color="hsl(var(--expense))" onClick={() => setQuickAdd("expense")} />
          <QuickAction icon="HandCoins" label="Loan" color="#06b6d4" onClick={() => setQuickAdd("loan")} />
          <QuickAction icon="Fuel" label="Fuel" color="hsl(var(--bike))" onClick={() => setQuickAdd("fuel")} />
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Income" amount={totalIncome} icon="TrendingUp" color="hsl(var(--income))" />
        <StatCard label="Total Expenses" amount={totalExpense} icon="TrendingDown" color="hsl(var(--expense))" />
        <StatCard
          label="Loan Summary"
          amount={loanSummary.given - loanSummary.borrowed}
          icon="HandCoins"
          color="#06b6d4"
          subtitle={loanSummary.overdue > 0 ? `${loanSummary.overdue} overdue` : "All clear"}
        />
      </div>
      <StatCard label="Bike Expenses (This Month)" amount={bikeCosts.monthlyCost} icon="Bike" color="hsl(var(--bike))" className="w-full" />

      {/* Budget progress */}
      {budgetProgress.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold">Budget Status</p>
          <div className="space-y-2">
            {budgetProgress.slice(0, 3).map((b) => (
              <div key={b.id} className="rounded-xl border border-border bg-card p-3">
                <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                  <span className="min-w-0 flex-1 truncate font-medium">{b.category}</span>
                  <span className={`shrink-0 ${b.isExceeded ? "font-semibold text-destructive" : "text-muted-foreground"}`}>
                    {formatCurrency(b.spent)} / {formatCurrency(b.amount)}
                  </span>
                </div>
                <ProgressBar value={b.ratio} barClassName={b.isExceeded ? "bg-destructive" : b.isNearLimit ? "bg-amber-500" : "bg-primary"} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming reminders */}
      {reminders.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold">Upcoming Reminders</p>
          <div className="space-y-2">
            {reminders.map((r) => (
              <div key={r.id} className="flex items-center gap-2 rounded-xl border border-border bg-card p-3">
                <Icons.BellRing className="h-4 w-4 shrink-0 text-amber-500" />
                <p className="min-w-0 flex-1 truncate text-sm">{r.title}</p>
                {r.dueDate && <p className="shrink-0 text-xs text-muted-foreground">{formatDateShort(r.dueDate)}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly chart */}
      <div>
        <p className="mb-2 text-sm font-semibold">Monthly Income vs Expense</p>
        <div className="rounded-2xl border border-border bg-card p-4">
          <IncomeExpenseChart transactions={allTxns} />
        </div>
      </div>

      {/* Category chart */}
      <div>
        <p className="mb-2 text-sm font-semibold">Expense by Category</p>
        <div className="rounded-2xl border border-border bg-card p-4">
          <CategoryPieChart transactions={allTxns} />
        </div>
      </div>

      {/* Recent transactions */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold">Recent Transactions</p>
          <Link href="/transactions" className="text-xs font-medium text-primary">View All</Link>
        </div>
        {recentTxns.length === 0 ? (
          <EmptyState icon="Receipt" title="No transactions yet" message="Tap the + button to add your first income or expense." />
        ) : (
          <div className="space-y-1">
            {recentTxns.map((t) => {
              const cat = categoryMeta(t.category, t.type);
              return (
                <div key={t.id} className="flex items-center gap-3 rounded-xl px-2 py-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: withAlpha(cat.color) }}>
                    <Icons.Circle className="h-2 w-2" style={{ color: cat.color, fill: cat.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.category}</p>
                    <p className="text-xs text-muted-foreground">{walletName(t.walletId)} • {formatRelativeDay(t.date)} {formatTime(t.date)}</p>
                  </div>
                  <p className={`shrink-0 text-sm font-semibold ${t.type === "income" ? "text-income" : "text-expense"}`}>
                    {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick-add dialogs */}
      <TransactionForm
        open={quickAdd === "income" || quickAdd === "expense"}
        onOpenChange={(v) => !v && setQuickAdd(null)}
        initialType={quickAdd as TransactionType}
      />
      <LoanForm open={quickAdd === "loan"} onOpenChange={(v) => !v && setQuickAdd(null)} direction="given" />
      {wallets[0] && <FuelDashboardWrapper open={quickAdd === "fuel"} onOpenChange={(v) => !v && setQuickAdd(null)} />}
    </div>
  );
}

function FuelDashboardWrapper({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const vehicles = useLiveQuery(() => db.vehicles.toArray(), []) ?? [];
  const vehicleId = vehicles[0]?.id;
  if (!vehicleId) return null;
  return <FuelForm open={open} onOpenChange={onOpenChange} vehicleId={vehicleId} />;
}

function QuickAction({ icon, label, color, onClick }: { icon: string; label: string; color: string; onClick: () => void }) {
  const Icon = (Icons as unknown as Record<string, LucideIcon>)[icon] ?? Icons.Circle;
  return (
    <button onClick={onClick} className="flex w-16 shrink-0 flex-col items-center gap-1.5">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: withAlpha(color) }}>
        <Icon className="h-6 w-6" style={{ color }} />
      </div>
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}
