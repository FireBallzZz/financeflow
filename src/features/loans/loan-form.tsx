"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { db } from "@/db/schema";
import type { Loan, LoanDirection } from "@/types";
import { useWallets, useWalletBalance } from "@/hooks/use-wallets";
import { WALLET_ICONS } from "@/lib/constants";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Chip } from "@/components/ui/chip";

function computeStatus(amount: number, paidAmount: number): Loan["status"] {
  if (paidAmount >= amount) return "paid";
  if (paidAmount > 0) return "partially_paid";
  return "unpaid";
}

/**
 * Money I Borrowed = I RECEIVE money -> income transaction ("Loan Received")
 *   in the wallet the money landed in.
 * Money I Gave = I PAY money out -> expense transaction ("Loan Given")
 *   from the wallet the money came from.
 * Editing an existing loan deletes its old linked transaction and creates a
 * fresh one reflecting the new amount/wallet/date, so there's never a stale
 * or duplicate transaction sitting around.
 */
export function LoanForm({
  open, onOpenChange, direction, editLoan,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  direction: LoanDirection;
  editLoan?: Loan | null;
}) {
  const isEditing = !!editLoan;
  const wallets = useWallets();
  const [person, setPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [walletId, setWalletId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const walletBalance = useWalletBalance(walletId ?? undefined);
  const selectedWallet = wallets.find((w) => w.id === walletId);

  useEffect(() => {
    if (!open) return;
    if (editLoan) {
      setPerson(editLoan.person);
      setPhone(editLoan.phone ?? "");
      setAmount(String(editLoan.amount));
      setDate(editLoan.date.slice(0, 10));
      setDueDate(editLoan.dueDate?.slice(0, 10) ?? "");
      setNotes(editLoan.notes ?? "");
      setWalletId(editLoan.walletId);
    } else {
      setPerson("");
      setPhone("");
      setAmount("");
      setDate(new Date().toISOString().slice(0, 10));
      setDueDate("");
      setNotes("");
      setWalletId(wallets.find((w) => w.isDefault)?.id ?? wallets[0]?.id ?? null);
    }
    // Depend on wallets.length (a stable primitive), not the wallets array
    // itself — using the array reference here can retrigger this effect on
    // every render while data is loading and cause an infinite loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editLoan, wallets.length]);

  async function handleSave() {
    if (!person.trim()) return toast.error("Enter a name");
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (!walletId) return toast.error("Please select a wallet");

    // "Given" loans pay money OUT of the wallet, so they need a balance
    // check. "Borrowed" loans bring money IN, so no balance check applies.
    // When editing a "given" loan on the SAME wallet, add back the old
    // amount first since the current balance already has it deducted.
    if (direction === "given") {
      const isSameWalletEdit = isEditing && editLoan?.walletId === walletId;
      const availableBalance = walletBalance + (isSameWalletEdit ? editLoan!.amount : 0);
      if (amt > availableBalance) {
        return toast.error(`Insufficient balance in ${selectedWallet?.name ?? "this"} wallet.`);
      }
    }

    setSaving(true);
    try {
      const isoDate = new Date(date).toISOString();
      const isoDueDate = dueDate ? new Date(dueDate).toISOString() : undefined;
      const trimmedNotes = notes.trim() || undefined;
      const trimmedPhone = phone.trim() || undefined;
      const trimmedPerson = person.trim();

      await db.transaction("rw", [db.loans, db.transactions], async () => {
        if (isEditing && editLoan?.id) {
          // Remove the old linked transaction (if any) before creating the
          // replacement, so amount/wallet changes never leave a stale entry
          // or double-count against the wallet balance.
          if (editLoan.transactionId) {
            await db.transactions.delete(editLoan.transactionId);
          }
          const newTxnId = await db.transactions.add({
            amount: amt,
            type: direction === "given" ? "expense" : "income",
            category: direction === "given" ? "Loan Given" : "Loan Received",
            walletId,
            date: isoDate,
            note: `Loan ${direction === "given" ? "to" : "from"} ${trimmedPerson}`,
            createdAt: new Date().toISOString(),
          });
          await db.loans.update(editLoan.id, {
            person: trimmedPerson,
            phone: trimmedPhone,
            amount: amt,
            date: isoDate,
            dueDate: isoDueDate,
            notes: trimmedNotes,
            walletId,
            transactionId: newTxnId as number,
            status: computeStatus(amt, editLoan.paidAmount),
          });
        } else {
          const txnId = await db.transactions.add({
            amount: amt,
            type: direction === "given" ? "expense" : "income",
            category: direction === "given" ? "Loan Given" : "Loan Received",
            walletId,
            date: isoDate,
            note: `Loan ${direction === "given" ? "to" : "from"} ${trimmedPerson}`,
            createdAt: new Date().toISOString(),
          });
          await db.loans.add({
            direction,
            person: trimmedPerson,
            phone: trimmedPhone,
            amount: amt,
            date: isoDate,
            dueDate: isoDueDate,
            paidAmount: 0,
            status: "unpaid",
            notes: trimmedNotes,
            createdAt: new Date().toISOString(),
            walletId,
            transactionId: txnId as number,
          });
        }
      });

      toast.success(isEditing ? "Loan updated" : "Loan saved");
      onOpenChange(false);
    } catch {
      toast.error("Something went wrong saving this loan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Loan" : direction === "given" ? "Money I Gave" : "Money I Borrowed"}
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <Label>Person Name</Label>
            <Input value={person} onChange={(e) => setPerson(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Phone Number (optional)</Label>
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Amount</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <Label className="mb-2 block">{direction === "given" ? "Paid From Wallet" : "Received Into Wallet"}</Label>
            <div className="flex flex-wrap gap-2">
              {wallets.map((w) => (
                <Chip
                  key={w.id}
                  label={w.name}
                  icon={WALLET_ICONS[w.type]}
                  color={w.color}
                  selected={walletId === w.id}
                  onClick={() => setWalletId(w.id!)}
                />
              ))}
            </div>
            {direction === "given" && walletId && (
              <p className="mt-1.5 text-xs text-muted-foreground">Available: {walletBalance.toFixed(2)}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Due Date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving}>{isEditing ? "Update" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function LoanPaymentForm({
  open, onOpenChange, loan,
}: { open: boolean; onOpenChange: (v: boolean) => void; loan: Loan | null }) {
  const wallets = useWallets();
  const [amount, setAmount] = useState("");
  const [walletId, setWalletId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const remaining = loan ? loan.amount - loan.paidAmount : 0;

  const walletBalance = useWalletBalance(walletId ?? undefined);
  const selectedWallet = wallets.find((w) => w.id === walletId);

  useEffect(() => {
    if (open) {
      setAmount("");
      setWalletId(wallets.find((w) => w.isDefault)?.id ?? wallets[0]?.id ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, wallets.length]);

  async function handleSave() {
    if (!loan?.id) return;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (amt > remaining) return toast.error(`Cannot exceed remaining amount of ${remaining.toFixed(2)}`);
    if (!walletId) return toast.error("Please select a wallet");

    // Paying back a "borrowed" loan is a real expense — must have enough
    // balance in the wallet. Collecting repayment on a "given" loan is
    // income, so no balance check applies there.
    if (loan.direction === "borrowed" && amt > walletBalance) {
      return toast.error(`Insufficient balance in ${selectedWallet?.name ?? "this"} wallet.`);
    }

    setSaving(true);
    try {
      await db.transaction("rw", [db.loans, db.loanPayments, db.transactions], async () => {
        const txnId = await db.transactions.add({
          amount: amt,
          type: loan.direction === "borrowed" ? "expense" : "income",
          category: loan.direction === "borrowed" ? "Loan Repayment" : "Loan Collection",
          walletId,
          date: new Date().toISOString(),
          note: `${loan.direction === "borrowed" ? "Repayment to" : "Collected from"} ${loan.person}`,
          createdAt: new Date().toISOString(),
        });

        await db.loanPayments.add({
          loanId: loan.id!,
          amount: amt,
          date: new Date().toISOString(),
          walletId,
          transactionId: txnId as number,
        });

        const newPaid = loan.paidAmount + amt;
        await db.loans.update(loan.id!, { paidAmount: newPaid, status: computeStatus(loan.amount, newPaid) });
      });

      toast.success("Payment recorded");
      onOpenChange(false);
    } catch {
      toast.error("Something went wrong recording this payment");
    } finally {
      setSaving(false);
    }
  }

  if (!loan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment — {loan.person}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-xl bg-muted p-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-semibold">{loan.amount.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Already Paid</span><span className="font-semibold">{loan.paidAmount.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Remaining</span><span className="font-semibold">{remaining.toFixed(2)}</span></div>
          </div>
          <div className="space-y-1.5">
            <Label>Payment Amount</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
          </div>
          <div>
            <Label className="mb-2 block">{loan.direction === "borrowed" ? "Pay From Wallet" : "Receive Into Wallet"}</Label>
            <div className="flex flex-wrap gap-2">
              {wallets.map((w) => (
                <Chip
                  key={w.id}
                  label={w.name}
                  icon={WALLET_ICONS[w.type]}
                  color={w.color}
                  selected={walletId === w.id}
                  onClick={() => setWalletId(w.id!)}
                />
              ))}
            </div>
            {loan.direction === "borrowed" && walletId && (
              <p className="mt-1.5 text-xs text-muted-foreground">Available: {walletBalance.toFixed(2)}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving}>Record Payment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
