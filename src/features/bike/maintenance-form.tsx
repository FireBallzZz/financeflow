"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { db } from "@/db/schema";
import type { MaintenanceLog, BikeMaintenanceType } from "@/types";
import { BIKE_MAINTENANCE_LABELS, BIKE_MAINTENANCE_ICONS, WALLET_ICONS } from "@/lib/constants";
import { useWallets, useWalletBalance } from "@/hooks/use-wallets";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Chip } from "@/components/ui/chip";

const TYPES = Object.keys(BIKE_MAINTENANCE_LABELS) as BikeMaintenanceType[];

export function MaintenanceForm({
  open, onOpenChange, vehicleId, editLog,
}: { open: boolean; onOpenChange: (v: boolean) => void; vehicleId: number; editLog?: MaintenanceLog | null }) {
  const isEditing = !!editLog;
  const wallets = useWallets();
  const [type, setType] = useState<BikeMaintenanceType>("engine_oil");
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
      setType(editLog.type);
      setAmount(String(editLog.amount));
      setOdometer(editLog.odometer ? String(editLog.odometer) : "");
      setDate(editLog.date.slice(0, 10));
      setNote(editLog.note ?? "");
      setWalletId(editLog.walletId);
    } else {
      setType("engine_oil"); setAmount(""); setOdometer("");
      setDate(new Date().toISOString().slice(0, 10)); setNote("");
      setWalletId(wallets.find((w) => w.isDefault)?.id ?? wallets[0]?.id ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editLog, wallets.length]);

  async function handleSave() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (!walletId) return toast.error("Please select a wallet");

    const isSameWalletEdit = isEditing && editLog?.walletId === walletId;
    const availableBalance = walletBalance + (isSameWalletEdit ? editLog!.amount : 0);
    if (amt > availableBalance) {
      return toast.error(`Insufficient balance in ${selectedWallet?.name ?? "this"} wallet.`);
    }

    setSaving(true);
    try {
      const isoDate = new Date(date).toISOString();
      const odoNum = odometer ? parseFloat(odometer) : undefined;
      const trimmedNote = note.trim() || undefined;
      // The specific maintenance type label (e.g. "Engine Oil") IS the
      // transaction's category, so it shows up correctly everywhere —
      // transaction history, analytics, budgets — without inventing a
      // second, duplicate category system.
      const category = BIKE_MAINTENANCE_LABELS[type];

      await db.transaction("rw", [db.maintenanceLogs, db.transactions], async () => {
        if (isEditing && editLog?.id) {
          if (editLog.transactionId) {
            await db.transactions.delete(editLog.transactionId);
          }
          const newTxnId = await db.transactions.add({
            amount: amt, type: "expense", category, walletId,
            date: isoDate, note: trimmedNote, createdAt: new Date().toISOString(),
          });
          await db.maintenanceLogs.update(editLog.id, {
            type: type, date: isoDate, amount: amt, odometer: odoNum,
            note: trimmedNote, walletId, transactionId: newTxnId as number,
          });
        } else {
          const txnId = await db.transactions.add({
            amount: amt, type: "expense", category, walletId,
            date: isoDate, note: trimmedNote, createdAt: new Date().toISOString(),
          });
          await db.maintenanceLogs.add({
            vehicleId, type, date: isoDate, amount: amt, odometer: odoNum,
            note: trimmedNote, walletId, transactionId: txnId as number,
          });
        }
      });

      toast.success(isEditing ? "Maintenance updated" : "Maintenance added");
      onOpenChange(false);
    } catch {
      toast.error("Something went wrong saving this maintenance record");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{isEditing ? "Edit" : "Add"} Maintenance</DialogTitle></DialogHeader>
        <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <Chip key={t} label={BIKE_MAINTENANCE_LABELS[t]} icon={BIKE_MAINTENANCE_ICONS[t]} selected={type === t} onClick={() => setType(t)} color="hsl(var(--bike))" />
            ))}
          </div>
          <div className="space-y-1.5"><Label>Amount</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Odometer (optional)</Label><Input type="number" value={odometer} onChange={(e) => setOdometer(e.target.value)} /></div>
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
