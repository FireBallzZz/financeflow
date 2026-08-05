"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/schema";
import { isTransfer } from "@/lib/utils";

export function useBudgets(month: number, year: number) {
  return useLiveQuery(() => db.budgets.where({ month, year }).toArray(), [month, year]) ?? [];
}

export interface BudgetProgress {
  id: number;
  category: string;
  amount: number;
  spent: number;
  remaining: number;
  ratio: number;
  isExceeded: boolean;
  isNearLimit: boolean;
}

export function useBudgetProgress(month: number, year: number) {
  return (
    useLiveQuery(async () => {
      const budgets = await db.budgets.where({ month, year }).toArray();
      const allTxns = await db.transactions.where("type").equals("expense").toArray();
      const realExpenses = allTxns.filter((t) => !isTransfer(t));
      const monthExpenses = realExpenses.filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() + 1 === month && d.getFullYear() === year;
      });

      return budgets.map((b): BudgetProgress => {
        const spent =
          b.category === "Overall"
            ? monthExpenses.reduce((s, t) => s + t.amount, 0)
            : monthExpenses.filter((t) => t.category === b.category).reduce((s, t) => s + t.amount, 0);
        const ratio = b.amount > 0 ? spent / b.amount : 0;
        return {
          id: b.id!,
          category: b.category,
          amount: b.amount,
          spent,
          remaining: b.amount - spent,
          ratio,
          isExceeded: spent > b.amount,
          isNearLimit: ratio >= 0.8 && spent <= b.amount,
        };
      });
    }, [month, year]) ?? []
  );
}
