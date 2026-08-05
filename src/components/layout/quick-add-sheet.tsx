"use client";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { db } from "@/db/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TransactionForm } from "@/features/transactions/transaction-form";
import { LoanForm } from "@/features/loans/loan-form";
import { FuelForm } from "@/features/bike/fuel-form";
import type { TransactionType } from "@/types";

type QuickAddKind = "income" | "expense" | "loan" | "fuel";

const OPTIONS: { kind: QuickAddKind; label: string; icon: string; color: string }[] = [
  { kind: "income", label: "Income", icon: "PlusCircle", color: "hsl(var(--income))" },
  { kind: "expense", label: "Expense", icon: "MinusCircle", color: "hsl(var(--expense))" },
  { kind: "loan", label: "Loan", icon: "HandCoins", color: "#06b6d4" },
  { kind: "fuel", label: "Fuel", icon: "Fuel", color: "hsl(var(--bike))" },
];

export function QuickAddSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [active, setActive] = useState<QuickAddKind | null>(null);
  const vehicles = useLiveQuery(() => db.vehicles.toArray(), []) ?? [];

  function choose(kind: QuickAddKind) {
    onOpenChange(false);
    setActive(kind);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader><DialogTitle>Quick Add</DialogTitle></DialogHeader>
          <div className="grid grid-cols-3 gap-3 pt-1">
            {OPTIONS.map((opt) => {
              const Icon = (Icons as unknown as Record<string, LucideIcon>)[opt.icon] ?? Icons.Circle;
              return (
                <button
                  key={opt.kind}
                  onClick={() => choose(opt.kind)}
                  className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 hover:bg-muted"
                >
                  <Icon className="h-6 w-6" style={{ color: opt.color }} />
                  <span className="text-xs font-medium">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <TransactionForm
        open={active === "income" || active === "expense"}
        onOpenChange={(v) => !v && setActive(null)}
        initialType={active as TransactionType}
      />
      <LoanForm open={active === "loan"} onOpenChange={(v) => !v && setActive(null)} direction="given" />
      {vehicles[0]?.id && (
        <FuelForm open={active === "fuel"} onOpenChange={(v) => !v && setActive(null)} vehicleId={vehicles[0].id} />
      )}
    </>
  );
}
