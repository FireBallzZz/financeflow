"use client";
import { useRouter } from "next/navigation";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/schema";
import { formatCurrency, formatRelativeDay, formatTime } from "@/lib/format";
import { WALLET_ICONS } from "@/lib/constants";
import { isTransfer, withAlpha } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from "@/lib/constants";
import type { TransactionType } from "@/types";

function categoryMeta(name: string, type: TransactionType) {
  const list = type === "income" ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;
  return list.find((c) => c.name === name) ?? list[list.length - 1];
}

export function WalletDetailView({ walletId }: { walletId: number }) {
  const router = useRouter();
  const wallet = useLiveQuery(() => db.wallets.get(walletId), [walletId]);
  const transactions = useLiveQuery(
    () => db.transactions.where("walletId").equals(walletId).reverse().sortBy("date"),
    [walletId]
  ) ?? [];

  if (wallet === undefined) return null;
  if (wallet === null) {
    return <EmptyState icon="AlertCircle" title="Wallet not found" message="This wallet may have been deleted." />;
  }

  const income = transactions.filter((t) => t.type === "income" && !isTransfer(t)).reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter((t) => t.type === "expense" && !isTransfer(t)).reduce((s, t) => s + t.amount, 0);
  const transfersIn = transactions.filter((t) => t.type === "income" && isTransfer(t)).reduce((s, t) => s + t.amount, 0);
  const transfersOut = transactions.filter((t) => t.type === "expense" && isTransfer(t)).reduce((s, t) => s + t.amount, 0);
  const currentBalance = wallet.openingBalance + income - expense + transfersIn - transfersOut;

  const Icon = (Icons as unknown as Record<string, LucideIcon>)[WALLET_ICONS[wallet.type]] ?? Icons.Wallet;

  return (
    <div className="space-y-5">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Icons.ChevronLeft className="h-4 w-4" /> Back
      </button>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: withAlpha(wallet.color) }}>
            <Icon className="h-6 w-6" style={{ color: wallet.color }} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{wallet.name}</p>
            <p className="text-2xl font-bold">{formatCurrency(currentBalance)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatBox label="Initial Balance" value={wallet.openingBalance} />
        <StatBox label="Current Balance" value={currentBalance} />
        <StatBox label="Total Income" value={income} tone="income" />
        <StatBox label="Total Expense" value={expense} tone="expense" />
        <StatBox label="Transfers In" value={transfersIn} tone="income" />
        <StatBox label="Transfers Out" value={transfersOut} tone="expense" />
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">All Transactions</p>
        {transactions.length === 0 ? (
          <EmptyState icon="Receipt" title="No transactions yet" message="Transactions for this wallet will show up here." />
        ) : (
          <div className="space-y-1">
            {transactions.map((t) => {
              const cat = categoryMeta(t.category, t.type);
              return (
                <div key={t.id} className="flex items-center gap-3 rounded-xl px-2 py-2.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: withAlpha(cat.color) }}>
                    {isTransfer(t) ? (
                      <Icons.ArrowLeftRight className="h-4 w-4" style={{ color: cat.color }} />
                    ) : (
                      <Icons.Circle className="h-2 w-2" style={{ color: cat.color, fill: cat.color }} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.category}</p>
                    <p className="text-xs text-muted-foreground">{formatRelativeDay(t.date)} • {formatTime(t.date)}</p>
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
    </div>
  );
}

function StatBox({ label, value, tone }: { label: string; value: number; tone?: "income" | "expense" }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-lg font-bold ${tone === "income" ? "text-income" : tone === "expense" ? "text-expense" : ""}`}>
        {formatCurrency(value)}
      </p>
    </div>
  );
}
