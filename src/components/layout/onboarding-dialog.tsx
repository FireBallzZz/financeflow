"use client";
import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/db/schema";
import { WALLET_ICONS } from "@/lib/constants";
import { withAlpha } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ONBOARDED_KEY = "financeflow:onboarded";

/**
 * Shown exactly once, on first launch, so the user's starting balances are
 * accurate from day one instead of silently defaulting to zero. Tracked via
 * a localStorage flag (not "are all balances zero", since a legitimately
 * empty wallet is a valid state after onboarding is complete).
 */
export function OnboardingDialog() {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<number, string>>({});
  const wallets = useLiveQuery(() => db.wallets.toArray(), []) ?? [];

  useEffect(() => {
    if (typeof window === "undefined") return;
    const done = localStorage.getItem(ONBOARDED_KEY);
    if (!done && wallets.length > 0) {
      setOpen(true);
      setValues(Object.fromEntries(wallets.map((w) => [w.id!, "0"])));
    }
    // Only re-check once wallets have loaded for the first time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallets.length > 0]);

  async function handleSave() {
    await Promise.all(
      wallets.map((w) => {
        const amt = parseFloat(values[w.id!] ?? "0") || 0;
        return db.wallets.update(w.id!, { openingBalance: amt });
      })
    );
    localStorage.setItem(ONBOARDED_KEY, "true");
    toast.success("Starting balances saved");
    setOpen(false);
  }

  function handleSkip() {
    localStorage.setItem(ONBOARDED_KEY, "true");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleSkip()}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Welcome to FinanceFlow</DialogTitle>
          <DialogDescription>
            Enter your current balance for each wallet to get started. You can always adjust these later.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {wallets.map((w) => {
            const Icon = (Icons as unknown as Record<string, LucideIcon>)[WALLET_ICONS[w.type]] ?? Icons.Wallet;
            return (
              <div key={w.id} className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: withAlpha(w.color) }}>
                  <Icon className="h-4.5 w-4.5" style={{ color: w.color }} />
                </div>
                <div className="flex-1">
                  <Label className="mb-1 block text-xs">{w.name}</Label>
                  <Input
                    type="number"
                    value={values[w.id!] ?? "0"}
                    onChange={(e) => setValues((v) => ({ ...v, [w.id!]: e.target.value }))}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleSkip}>Skip for now</Button>
          <Button onClick={handleSave}>Save Starting Balances</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
