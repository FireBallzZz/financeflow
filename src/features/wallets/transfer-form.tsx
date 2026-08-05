"use client";
import { useState } from "react";
import { toast } from "sonner";
import { db } from "@/db/schema";
import { useWallets, useWalletBalance } from "@/hooks/use-wallets";
import { generateId } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Chip } from "@/components/ui/chip";
import { WALLET_ICONS } from "@/lib/constants";

export function TransferForm({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const wallets = useWallets();
  const [fromId, setFromId] = useState<number | null>(null);
  const [toId, setToId] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  const fromBalance = useWalletBalance(fromId ?? undefined);
  const fromWallet = wallets.find((w) => w.id === fromId);

  async function handleTransfer() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (!fromId || !toId) return toast.error("Select both wallets");
    if (fromId === toId) return toast.error("Choose two different wallets");
    if (amt > fromBalance) {
      return toast.error(`Insufficient balance in ${fromWallet?.name ?? "source"} wallet.`);
    }

    const transferId = generateId();
    const isoDate = new Date(date).toISOString();
    const trimmedNote = note.trim() || undefined;
    await db.transactions.bulkAdd([
      {
        amount: amt, type: "expense", category: "Transfer Out", walletId: fromId, date: isoDate,
        transferId, note: trimmedNote, createdAt: new Date().toISOString(),
      },
      {
        amount: amt, type: "income", category: "Transfer In", walletId: toId, date: isoDate,
        transferId, note: trimmedNote, createdAt: new Date().toISOString(),
      },
    ]);
    toast.success("Transfer complete");
    setAmount("");
    setNote("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Between Wallets</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">From</Label>
            <div className="flex flex-wrap gap-2">
              {wallets.map((w) => (
                <Chip key={w.id} label={w.name} icon={WALLET_ICONS[w.type]} color={w.color} selected={fromId === w.id} onClick={() => setFromId(w.id!)} />
              ))}
            </div>
            {fromId && <p className="mt-1.5 text-xs text-muted-foreground">Available: {fromBalance.toFixed(2)}</p>}
          </div>
          <div>
            <Label className="mb-2 block">To</Label>
            <div className="flex flex-wrap gap-2">
              {wallets.map((w) => (
                <Chip key={w.id} label={w.name} icon={WALLET_ICONS[w.type]} color={w.color} selected={toId === w.id} onClick={() => setToId(w.id!)} />
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Amount</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Note (optional)</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Moving savings to bKash" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleTransfer}>Transfer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
