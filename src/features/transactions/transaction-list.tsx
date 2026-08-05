"use client";
import { useMemo, useState } from "react";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Transaction } from "@/types";
import { useWallets } from "@/hooks/use-wallets";
import { useTransactions, filterTransactions, type TransactionFilters } from "@/hooks/use-transactions";
import { formatCurrency, formatRelativeDay, formatTime } from "@/lib/format";
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES, WALLET_ICONS } from "@/lib/constants";
import { withAlpha } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Chip } from "@/components/ui/chip";
import { TransactionForm } from "./transaction-form";

function categoryMeta(name: string, type: "income" | "expense") {
  const list = type === "income" ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;
  return list.find((c) => c.name === name) ?? list[list.length - 1];
}

export function TransactionList({ initialFilters }: { initialFilters?: TransactionFilters }) {
  const allTxns = useTransactions();
  const wallets = useWallets();
  const [filters, setFilters] = useState<TransactionFilters>(initialFilters ?? {});
  const [filterOpen, setFilterOpen] = useState(false);
  const [editTxn, setEditTxn] = useState<Transaction | null | undefined>(undefined);

  const filtered = useMemo(() => filterTransactions(allTxns, filters), [allTxns, filters]);
  const walletName = (id: number) => wallets.find((w) => w.id === id)?.name ?? "—";

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Icons.Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search notes or category..."
            className="pl-10"
            value={filters.query ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
          />
        </div>
        <Button variant="outline" size="icon" onClick={() => setFilterOpen(true)}>
          <Icons.SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <Chip label="All" selected={!filters.type} onClick={() => setFilters((f) => ({ ...f, type: undefined }))} />
        <Chip
          label="Income"
          selected={filters.type === "income"}
          onClick={() => setFilters((f) => ({ ...f, type: "income" }))}
          color="hsl(var(--income))"
        />
        <Chip
          label="Expense"
          selected={filters.type === "expense"}
          onClick={() => setFilters((f) => ({ ...f, type: "expense" }))}
          color="hsl(var(--expense))"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <Chip
          label="All Wallets"
          selected={!filters.walletId}
          onClick={() => setFilters((f) => ({ ...f, walletId: undefined }))}
        />
        {wallets.map((w) => (
          <Chip
            key={w.id}
            label={w.name}
            icon={WALLET_ICONS[w.type]}
            color={w.color}
            selected={filters.walletId === w.id}
            onClick={() => setFilters((f) => ({ ...f, walletId: f.walletId === w.id ? undefined : w.id }))}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="ReceiptText"
          title="No transactions found"
          message="Try adjusting your filters, or add a new transaction."
        />
      ) : (
        <div className="space-y-1">
          {filtered.map((t) => {
            const cat = categoryMeta(t.category, t.type);
            const Icon = (Icons as unknown as Record<string, LucideIcon>)[cat.icon] ?? Icons.Circle;
            return (
              <button
                key={t.id}
                onClick={() => setEditTxn(t)}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-muted"
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: withAlpha(cat.color) }}
                >
                  <Icon className="h-5 w-5" style={{ color: cat.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{t.category}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {walletName(t.walletId)} • {formatRelativeDay(t.date)} • {formatTime(t.date)}
                  </p>
                </div>
                <p className={`shrink-0 text-sm font-bold ${t.type === "income" ? "text-income" : "text-expense"}`}>
                  {t.type === "income" ? "+" : "-"}
                  {formatCurrency(t.amount)}
                </p>
              </button>
            );
          })}
        </div>
      )}

      <TransactionForm
        open={editTxn !== undefined}
        onOpenChange={(v) => !v && setEditTxn(undefined)}
        editTransaction={editTxn}
      />

      <AdvancedFilterDialog
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={filters}
        onApply={setFilters}
      />
    </div>
  );
}

function AdvancedFilterDialog({
  open, onOpenChange, filters, onApply,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  filters: TransactionFilters;
  onApply: (f: TransactionFilters) => void;
}) {
  const wallets = useWallets();
  const [category, setCategory] = useState(filters.category);
  const [walletId, setWalletId] = useState(filters.walletId);
  const [minAmount, setMinAmount] = useState(filters.minAmount?.toString() ?? "");
  const [maxAmount, setMaxAmount] = useState(filters.maxAmount?.toString() ?? "");
  const [from, setFrom] = useState(filters.from ? filters.from.toISOString().slice(0, 10) : "");
  const [to, setTo] = useState(filters.to ? filters.to.toISOString().slice(0, 10) : "");

  const allCategories = [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES].map((c) => c.name);
  const uniqueCategories = Array.from(new Set(allCategories));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Advanced Filters</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium">Category</p>
            <div className="flex flex-wrap gap-2">
              {uniqueCategories.map((c) => (
                <Chip key={c} label={c} selected={category === c} onClick={() => setCategory(category === c ? undefined : c)} />
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Wallet</p>
            <div className="flex flex-wrap gap-2">
              {wallets.map((w) => (
                <Chip
                  key={w.id}
                  label={w.name}
                  selected={walletId === w.id}
                  onClick={() => setWalletId(walletId === w.id ? undefined : w.id)}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Min amount" type="number" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} />
            <Input placeholder="Max amount" type="number" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onApply({ query: filters.query });
              onOpenChange(false);
            }}
          >
            Reset
          </Button>
          <Button
            onClick={() => {
              onApply({
                query: filters.query,
                type: filters.type,
                category,
                walletId,
                from: from ? new Date(from) : undefined,
                to: to ? new Date(to) : undefined,
                minAmount: minAmount ? parseFloat(minAmount) : undefined,
                maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
              });
              onOpenChange(false);
            }}
          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
