"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/schema";
import type { Transaction, TransactionType } from "@/types";

export function useTransactions() {
  return useLiveQuery(() => db.transactions.orderBy("date").reverse().toArray(), []) ?? [];
}

export function useRecentTransactions(limit = 6) {
  return useLiveQuery(() => db.transactions.orderBy("date").reverse().limit(limit).toArray(), [limit]) ?? [];
}

export function useMonthTransactions(year: number, month: number) {
  return (
    useLiveQuery(async () => {
      const all = await db.transactions.toArray();
      return all.filter((t) => {
        const d = new Date(t.date);
        return d.getFullYear() === year && d.getMonth() === month;
      });
    }, [year, month]) ?? []
  );
}

export interface TransactionFilters {
  query?: string;
  type?: TransactionType;
  category?: string;
  walletId?: number;
  from?: Date;
  to?: Date;
  minAmount?: number;
  maxAmount?: number;
}

export function filterTransactions(txns: Transaction[], f: TransactionFilters): Transaction[] {
  return txns.filter((t) => {
    if (f.type && t.type !== f.type) return false;
    if (f.category && t.category !== f.category) return false;
    if (f.walletId && t.walletId !== f.walletId) return false;
    if (f.from && new Date(t.date) < f.from) return false;
    if (f.to && new Date(t.date) > f.to) return false;
    if (f.minAmount !== undefined && t.amount < f.minAmount) return false;
    if (f.maxAmount !== undefined && t.amount > f.maxAmount) return false;
    if (f.query) {
      const q = f.query.toLowerCase();
      const inNote = (t.note ?? "").toLowerCase().includes(q);
      const inCategory = t.category.toLowerCase().includes(q);
      if (!inNote && !inCategory) return false;
    }
    return true;
  });
}
