"use client";
import { useState } from "react";
import * as Icons from "lucide-react";
import type { Loan, LoanDirection } from "@/types";
import { useLoansByDirection, isLoanOverdue } from "@/hooks/use-loans";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { db } from "@/db/schema";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { LoanForm, LoanPaymentForm } from "./loan-form";

export function LoanTracker() {
  const [tab, setTab] = useState<LoanDirection>("given");
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as LoanDirection)}>
        <div className="flex items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="given">Money I Gave</TabsTrigger>
            <TabsTrigger value="borrowed">Money I Borrowed</TabsTrigger>
          </TabsList>
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Icons.Plus className="h-4 w-4" /> Add
          </Button>
        </div>
        <TabsContent value="given"><LoanColumn direction="given" /></TabsContent>
        <TabsContent value="borrowed"><LoanColumn direction="borrowed" /></TabsContent>
      </Tabs>

      <LoanForm open={formOpen} onOpenChange={setFormOpen} direction={tab} />
    </div>
  );
}

function LoanColumn({ direction }: { direction: LoanDirection }) {
  const loans = useLoansByDirection(direction);
  const [editLoan, setEditLoan] = useState<Loan | null | undefined>(undefined);
  const [paymentLoan, setPaymentLoan] = useState<Loan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Loan | null>(null);

  if (loans.length === 0) {
    return (
      <EmptyState
        icon="HandCoins"
        title={direction === "given" ? "No loans given" : "No loans borrowed"}
        message="Track money you lend or borrow, with due dates and partial payments."
      />
    );
  }

  return (
    <div className="space-y-3">
      {loans.map((loan) => {
        const remaining = loan.amount - loan.paidAmount;
        const overdue = isLoanOverdue(loan.dueDate, loan.status);
        return (
          <div
            key={loan.id}
            className={`rounded-2xl border bg-card p-4 ${overdue ? "border-destructive/50" : "border-border"}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {loan.person.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold">{loan.person}</p>
                  {loan.phone && <p className="text-xs text-muted-foreground">{loan.phone}</p>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{formatCurrency(loan.amount)}</p>
                {loan.paidAmount > 0 && (
                  <p className="text-xs text-muted-foreground">{formatCurrency(remaining)} left</p>
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Given: {formatDateShort(loan.date)}</span>
              {loan.dueDate && (
                <span className={overdue ? "font-semibold text-destructive" : ""}>
                  • Due: {formatDateShort(loan.dueDate)}
                </span>
              )}
              {overdue && <Badge variant="destructive">OVERDUE</Badge>}
              {loan.status === "paid" && <Badge variant="success">PAID</Badge>}
              {loan.status === "partially_paid" && <Badge variant="warning">PARTIAL</Badge>}
            </div>

            <div className="mt-3 flex gap-2">
              {loan.status !== "paid" && (
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setPaymentLoan(loan)}>
                  Record Payment
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => setEditLoan(loan)}>
                <Icons.Pencil className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(loan)}>
                <Icons.Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}

      <LoanForm open={editLoan !== undefined} onOpenChange={(v) => !v && setEditLoan(undefined)} direction={direction} editLoan={editLoan} />
      <LoanPaymentForm open={!!paymentLoan} onOpenChange={(v) => !v && setPaymentLoan(null)} loan={paymentLoan} />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete loan?"
        description="This will permanently remove this loan and its payment history."
        destructive
        confirmLabel="Delete"
        onConfirm={async () => {
          if (deleteTarget?.id) {
            const loanId = deleteTarget.id;
            await db.transaction("rw", [db.loans, db.loanPayments, db.transactions], async () => {
              // Every payment made against this loan created its own linked
              // expense/income transaction — remove all of them too, or the
              // wallet balances would stay wrong after the loan is gone.
              const payments = await db.loanPayments.where("loanId").equals(loanId).toArray();
              for (const p of payments) {
                if (p.transactionId) await db.transactions.delete(p.transactionId);
              }
              await db.loanPayments.where("loanId").equals(loanId).delete();

              if (deleteTarget.transactionId) {
                await db.transactions.delete(deleteTarget.transactionId);
              }
              await db.loans.delete(loanId);
            });
            toast.success("Loan deleted");
          }
        }}
      />
    </div>
  );
}
