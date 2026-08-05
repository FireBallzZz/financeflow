"use client";
import { useState } from "react";
import * as Icons from "lucide-react";
import { db } from "@/db/schema";
import { useBudgetProgress } from "@/hooks/use-budgets";
import { formatCurrency, formatMonthYear } from "@/lib/format";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { BudgetForm } from "./budget-form";

export function BudgetPlanner() {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });
  const [formOpen, setFormOpen] = useState(false);
  const progress = useBudgetProgress(cursor.month, cursor.year);
  const exceededCount = progress.filter((p) => p.isExceeded).length;

  function shiftMonth(delta: number) {
    setCursor((c) => {
      const d = new Date(c.year, c.month - 1 + delta, 1);
      return { month: d.getMonth() + 1, year: d.getFullYear() };
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => shiftMonth(-1)}><Icons.ChevronLeft className="h-4 w-4" /></Button>
        <p className="text-sm font-semibold">{formatMonthYear(new Date(cursor.year, cursor.month - 1, 1))}</p>
        <Button variant="ghost" size="icon" onClick={() => shiftMonth(1)}><Icons.ChevronRight className="h-4 w-4" /></Button>
      </div>

      <Button onClick={() => setFormOpen(true)} className="w-full"><Icons.Plus className="h-4 w-4" /> Set Budget</Button>

      {progress.length === 0 ? (
        <EmptyState icon="PieChart" title="No budgets set for this month" message="Set monthly limits to keep your spending in check." />
      ) : (
        <div className="space-y-3">
          {exceededCount > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">
              <Icons.AlertTriangle className="h-4 w-4 shrink-0" />
              You have exceeded {exceededCount} budget{exceededCount > 1 ? "s" : ""} this month.
            </div>
          )}
          {progress.map((p) => (
            <div key={p.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold">{p.category}</p>
                <button
                  onClick={async () => { await db.budgets.delete(p.id); }}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  Remove
                </button>
              </div>
              <ProgressBar
                value={p.ratio}
                barClassName={p.isExceeded ? "bg-destructive" : p.isNearLimit ? "bg-amber-500" : "bg-primary"}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                {formatCurrency(p.spent)} of {formatCurrency(p.amount)} spent
                {p.isExceeded
                  ? ` • ${formatCurrency(p.spent - p.amount)} over`
                  : ` • ${formatCurrency(p.remaining)} left`}
              </p>
            </div>
          ))}
        </div>
      )}

      <BudgetForm open={formOpen} onOpenChange={setFormOpen} month={cursor.month} year={cursor.year} />
    </div>
  );
}
