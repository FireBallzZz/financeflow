"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { db } from "@/db/schema";
import type { Transaction, TransactionType } from "@/types";
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from "@/lib/constants";
import { useWallets, useWalletBalance } from "@/hooks/use-wallets";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Chip } from "@/components/ui/chip";
import { WALLET_ICONS } from "@/lib/constants";

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTransaction?: Transaction | null;
  initialType?: TransactionType;
}

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}
function toTimeInputValue(d: Date) {
  return d.toTimeString().slice(0, 5);
}

export function TransactionForm({ open, onOpenChange, editTransaction, initialType }: TransactionFormProps) {
  const wallets = useWallets();
  const isEditing = !!editTransaction;

  const [type, setType] = useState<TransactionType>(initialType ?? "expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [walletId, setWalletId] = useState<number | null>(null);
  const [date, setDate] = useState(toDateInputValue(new Date()));
  const [time, setTime] = useState(toTimeInputValue(new Date()));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Reactively tracks the selected wallet's current computed balance so we
  // can validate expenses against it before saving.
  const selectedWalletBalance = useWalletBalance(walletId ?? undefined);
  const selectedWallet = wallets.find((w) => w.id === walletId);

  useEffect(() => {
    if (!open) return;
    if (editTransaction) {
      const d = new Date(editTransaction.date);
      setType(editTransaction.type);
      setAmount(String(editTransaction.amount));
      setCategory(editTransaction.category);
      setWalletId(editTransaction.walletId);
      setDate(toDateInputValue(d));
      setTime(toTimeInputValue(d));
      setNote(editTransaction.note ?? "");
    } else {
      setType(initialType ?? "expense");
      setAmount("");
      setCategory(null);
      setWalletId(wallets.find((w) => w.isDefault)?.id ?? wallets[0]?.id ?? null);
      setDate(toDateInputValue(new Date()));
      setTime(toTimeInputValue(new Date()));
      setNote("");
    }
  }, [open, editTransaction, initialType, wallets]);

  const categories = type === "income" ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;

  async function handleSave() {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return toast.error("Enter a valid amount");
    if (!category) return toast.error("Please select a category");
    if (!walletId) return toast.error("Please select a wallet");

    // Balance validation: block expenses that would overdraw the wallet.
    // If we're editing an existing expense on the SAME wallet, the current
    // computed balance already has the old amount deducted — add it back
    // to get the true amount available before this edit.
    if (type === "expense") {
      const isSameWalletExpenseEdit =
        isEditing && editTransaction?.type === "expense" && editTransaction.walletId === walletId;
      const availableBalance = selectedWalletBalance + (isSameWalletExpenseEdit ? editTransaction!.amount : 0);
      if (parsedAmount > availableBalance) {
        return toast.error(`Insufficient balance in ${selectedWallet?.name ?? "this"} wallet.`);
      }
    }

    setSaving(true);
    const isoDate = new Date(`${date}T${time}:00`).toISOString();

    try {
      if (isEditing && editTransaction?.id) {
        await db.transactions.update(editTransaction.id, {
          amount: parsedAmount, type, category, walletId, date: isoDate,
          note: note.trim() || undefined,
        });
        toast.success("Transaction updated");
      } else {
        await db.transactions.add({
          amount: parsedAmount, type, category, walletId, date: isoDate,
          note: note.trim() || undefined, createdAt: new Date().toISOString(),
        });
        toast.success("Transaction added");
      }
      onOpenChange(false);
    } catch {
      toast.error("Something went wrong saving this transaction");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editTransaction?.id) return;
    await db.transactions.delete(editTransaction.id);
    toast.success("Transaction deleted");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
            <button
              onClick={() => { setType("expense"); setCategory(null); }}
              className={`rounded-lg py-2 text-sm font-semibold transition-colors ${type === "expense" ? "bg-expense text-white" : "text-muted-foreground"}`}
            >
              Expense
            </button>
            <button
              onClick={() => { setType("income"); setCategory(null); }}
              className={`rounded-lg py-2 text-sm font-semibold transition-colors ${type === "income" ? "bg-income text-white" : "text-muted-foreground"}`}
            >
              Income
            </button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="text-xl font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Chip
                  key={c.name}
                  label={c.name}
                  icon={c.icon}
                  color={c.color}
                  selected={category === c.name}
                  onClick={() => setCategory(c.name)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Wallet</Label>
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="time">Time</Label>
              <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note">Notes (optional)</Label>
            <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter className="mt-2">
          {isEditing && (
            <Button variant="destructive" onClick={handleDelete} className="sm:mr-auto">
              Delete
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {isEditing ? "Update" : "Save"} Transaction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
