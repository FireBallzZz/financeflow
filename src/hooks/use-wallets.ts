"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/schema";
import type { Wallet } from "@/types";

export function useWallets() {
  return useLiveQuery(() => db.wallets.orderBy("id").toArray(), []) ?? [];
}

/** Computed balance = opening balance + income - expense for that wallet. */
export function useWalletBalance(walletId: number | undefined) {
  return (
    useLiveQuery(async () => {
      if (!walletId) return 0;
      const wallet = await db.wallets.get(walletId);
      if (!wallet) return 0;
      const txns = await db.transactions.where("walletId").equals(walletId).toArray();
      const income = txns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
      const expense = txns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
      return wallet.openingBalance + income - expense;
    }, [walletId]) ?? 0
  );
}

export function useTotalBalance() {
  return (
    useLiveQuery(async () => {
      const wallets = await db.wallets.toArray();
      const txns = await db.transactions.toArray();
      return wallets.reduce((total: number, w: Wallet) => {
        const walletTxns = txns.filter((t) => t.walletId === w.id);
        const income = walletTxns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
        const expense = walletTxns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
        return total + w.openingBalance + income - expense;
      }, 0);
    }, []) ?? 0
  );
}
