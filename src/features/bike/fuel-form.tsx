"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { db } from "@/db/schema";
import type { FuelLog } from "@/types";
import { useWallets, useWalletBalance } from "@/hooks/use-wallets";
import { WALLET_ICONS } from "@/lib/constants";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Chip } from "@/components/ui/chip";

export function FuelForm({
  open, onOpenChange, vehicleId, editLog,
}: { open: boolean; onOpenChange: (v: boolean) => void; vehicleId: number; editLog?: FuelLog | null }) {
  const isEditing = !!editLog;
  const wallets = useWallets();
  const [liters, setLiters] = useState("");
  const [pricePerLiter, setPricePerLiter] = useState("");
  const [amount, setAmount] = useState("");
  const [odometer, setOdometer] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [walletId, setWalletId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const walletBalance = useWalletBalance(walletId ?? undefined);
  const selectedWallet = wallets.find((w) => w.id === walletId);

  useEffect(() => {
    if (!open) return;
    if (editLog) {
      setLiters(String(editLog.liters));
      setPricePerLiter(String(editLog.pricePerLiter));
      setAmount(String(editLog.amount));
      setOdometer(String(editLog.odometer));
      setDate(editLog.date.slice(0, 10));
      setNote(editLog.note ?? "");
      setWalletId(editLog.walletId);
    } else {
      setLiters(""); setPricePerLiter(""); setAmount(""); setOdometer("");
      setDate(new Date().toISOString().slice(0, 10)); setNote("");
      setWalletId(wallets.find((w) => w.isDefault)?.id ?? wallets[0]?.id ?? null);
    }
    // Depend on wallets.length (stable primitive), not the array itself —
    // see loan-form.tsx for why this matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editLog, wallets.length]);

  function recalcAmount(l: string, p: string) {
    const lNum = parseFloat(l);
    const pNum = parseFloat(p);
    if (lNum && pNum) setAmount((lNum * pNum).toFixed(2));
  }

  async function handleSave() {
    const litersNum = parseFloat(liters);
    const priceNum = parseFloat(pricePerLiter);
    const amountNum = parseFloat(amount);
    const odoNum = parseFloat(odometer);
    if (!litersNum || !priceNum || !amountNum || !odoNum) return toast.error("Fill in all required fields");
    if (!walletId) return toast.error("Please select a wallet");

    const isSameWalletEdit = isEditing && editLog?.walletId === walletId;
    const availableBalance = walletBalance + (isSameWalletEdit ? editLog!.amount : 0);
    if (amountNum > availableBalance) {
      return toast.error(`Insufficient balance in ${selectedWallet?.name ?? "this"} wallet.`);
    }

    setSaving(true);
    try {
      const isoDate = new Date(date).toISOString();
      const trimmedNote = note.trim() || undefined;

      await db.transaction("rw", [db.fuelLogs, db.transactions], async () => {
        if (isEditing && editLog?.id) {
          if (editLog.transactionId) {
            await db.transactions.delete(editLog.transactionId);
          }
          const newTxnId = await db.transactions.add({
            amount: amountNum, type: "expense", category: "Fuel", walletId,
            date: isoDate, note: trimmedNote, createdAt: new Date().toISOString(),
          });
          await db.fuelLogs.update(editLog.id, {
            date: isoDate, amount: amountNum, liters: litersNum, pricePerLiter: priceNum,
            odometer: odoNum, note: trimmedNote, walletId, transactionId: newTxnId as number,
          });
        } else {
          const txnId = await db.transactions.add({
            amount: amountNum, type: "expense", category: "Fuel", walletId,
            date: isoDate, note: trimmedNote, createdAt: new Date().toISOString(),
          });
          await db.fuelLogs.add({
            vehicleId, date: isoDate, amount: amountNum, liters: litersNum, pricePerLiter: priceNum,
            odometer: odoNum, note: trimmedNote, walletId, transactionId: txnId as number,
          });
        }
      });

      toast.success(isEditing ? "Fuel log updated" : "Fuel log added");
      onOpenChange(false);
    } catch {
      toast.error("Something went wrong saving this fuel log");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{isEditing ? "Edit" : "Add"} Fuel Log</DialogTitle></DialogHeader>
        <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Liters</Label>
              <Input type="number" value={liters} onChange={(e) => { setLiters(e.target.value); recalcAmount(e.target.value, pricePerLiter); }} />
            </div>
            <div className="space-y-1.5">
              <Label>Price / Liter</Label>
              <Input type="number" value={pricePerLiter} onChange={(e) => { setPricePerLiter(e.target.value); recalcAmount(liters, e.target.value); }} />
            </div>
          </div>
          <div className="space-y-1.5"><Label>Total Amount</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Odometer (km)</Label><Input type="number" value={odometer} onChange={(e) => setOdometer(e.target.value)} /></div>
          <div>
            <Label className="mb-2 block">Paid From Wallet</Label>
            <div className="flex flex-wrap gap-2">
              {wallets.map((w) => (
                <Chip key={w.id} label={w.name} icon={WALLET_ICONS[w.type]} color={w.color} selected={walletId === w.id} onClick={() => setWalletId(w.id!)} />
              ))}
            </div>
            {walletId && <p className="mt-1.5 text-xs text-muted-foreground">Available: {walletBalance.toFixed(2)}</p>}
          </div>
          <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Notes (optional)</Label><Input value={note} onChange={(e) => setNote(e.target.value)} /></div>
        </div>
        <DialogFooter><Button onClick={handleSave} disabled={saving}>{isEditing ? "Update" : "Save"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
