"use client";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Search, X } from "lucide-react";
import { db } from "@/db/schema";
import { formatCurrency, formatDate } from "@/lib/format";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";

export function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const transactions = useLiveQuery(() => db.transactions.toArray(), []) ?? [];
  const loans = useLiveQuery(() => db.loans.toArray(), []) ?? [];
  const wallets = useLiveQuery(() => db.wallets.toArray(), []) ?? [];

  const walletName = (id: number) => wallets.find((w) => w.id === id)?.name ?? "";

  const matchedTxns =
    q.length === 0
      ? []
      : transactions.filter(
          (t) =>
            t.category.toLowerCase().includes(q) ||
            (t.note ?? "").toLowerCase().includes(q) ||
            walletName(t.walletId).toLowerCase().includes(q) ||
            String(t.amount).includes(q) ||
            formatDate(t.date).toLowerCase().includes(q)
        );

  const matchedLoans =
    q.length === 0
      ? []
      : loans.filter(
          (l) =>
            l.person.toLowerCase().includes(q) ||
            (l.phone ?? "").includes(q) ||
            (l.notes ?? "").toLowerCase().includes(q) ||
            String(l.amount).includes(q)
        );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="sr-only">Search</DialogTitle>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search person, category, wallet, amount, date, notes..."
              className="h-12 pl-10 pr-9"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          {q.length === 0 ? (
            <EmptyState
              icon="Search"
              title="Search everything"
              message="Find a transaction or loan by person, category, wallet, amount, date, or notes."
            />
          ) : matchedTxns.length === 0 && matchedLoans.length === 0 ? (
            <EmptyState icon="SearchX" title="No results found" message="Try a different search term." />
          ) : (
            <div className="space-y-5">
              {matchedLoans.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                    Loans ({matchedLoans.length})
                  </p>
                  <div className="space-y-1">
                    {matchedLoans.map((l) => (
                      <div key={l.id} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-muted">
                        <div>
                          <p className="text-sm font-medium">{l.person}</p>
                          <p className="text-xs text-muted-foreground">
                            {l.direction === "given" ? "You gave" : "You borrowed"}
                          </p>
                        </div>
                        <p className="text-sm font-semibold">{formatCurrency(l.amount)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {matchedTxns.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                    Transactions ({matchedTxns.length})
                  </p>
                  <div className="space-y-1">
                    {matchedTxns.map((t) => (
                      <div key={t.id} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-muted">
                        <div>
                          <p className="text-sm font-medium">{t.category}</p>
                          <p className="text-xs text-muted-foreground">
                            {walletName(t.walletId)} • {formatDate(t.date)}
                          </p>
                        </div>
                        <p className={`text-sm font-semibold ${t.type === "income" ? "text-income" : "text-expense"}`}>
                          {t.type === "income" ? "+" : "-"}
                          {formatCurrency(t.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
