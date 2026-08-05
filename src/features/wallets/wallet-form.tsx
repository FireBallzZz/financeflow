"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { db } from "@/db/schema";
import type { Wallet, WalletType } from "@/types";
import { WALLET_LABELS, WALLET_ICONS, WALLET_COLORS } from "@/lib/constants";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Chip } from "@/components/ui/chip";
import { Switch } from "@/components/ui/switch";

const WALLET_TYPES: WalletType[] = ["cash", "bank", "bkash", "nagad", "rocket", "custom"];

export function WalletForm({
  open, onOpenChange, editWallet,
}: { open: boolean; onOpenChange: (v: boolean) => void; editWallet?: Wallet | null }) {
  const isEditing = !!editWallet;
  const [type, setType] = useState<WalletType>("cash");
  const [name, setName] = useState("Cash");
  const [openingBalance, setOpeningBalance] = useState("0");
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editWallet) {
      setType(editWallet.type);
      setName(editWallet.name);
      setOpeningBalance(String(editWallet.openingBalance));
      setIsDefault(editWallet.isDefault);
    } else {
      setType("cash");
      setName("Cash");
      setOpeningBalance("0");
      setIsDefault(false);
    }
  }, [open, editWallet]);

  async function handleSave() {
    const balance = parseFloat(openingBalance) || 0;
    if (isEditing && editWallet?.id) {
      await db.wallets.update(editWallet.id, { type, name: name.trim() || WALLET_LABELS[type], openingBalance: balance, isDefault });
      toast.success("Wallet updated");
    } else {
      await db.wallets.add({
        type, name: name.trim() || WALLET_LABELS[type], openingBalance: balance,
        color: WALLET_COLORS[type], isDefault, archived: false, createdAt: new Date().toISOString(),
      });
      toast.success("Wallet added");
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Wallet" : "New Wallet"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {WALLET_TYPES.map((t) => (
              <Chip
                key={t}
                label={WALLET_LABELS[t]}
                icon={WALLET_ICONS[t]}
                color={WALLET_COLORS[t]}
                selected={type === t}
                onClick={() => {
                  setType(t);
                  if (!isEditing) setName(WALLET_LABELS[t]);
                }}
              />
            ))}
          </div>
          <div className="space-y-1.5">
            <Label>Wallet Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Opening Balance</Label>
            <Input type="number" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border p-3">
            <Label htmlFor="default-wallet" className="cursor-pointer">Set as default wallet</Label>
            <Switch id="default-wallet" checked={isDefault} onCheckedChange={setIsDefault} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>{isEditing ? "Update" : "Add"} Wallet</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
