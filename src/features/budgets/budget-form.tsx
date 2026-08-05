"use client";
import { useState } from "react";
import { toast } from "sonner";
import { db } from "@/db/schema";
import { DEFAULT_EXPENSE_CATEGORIES } from "@/lib/constants";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Chip } from "@/components/ui/chip";

export function BudgetForm({
  open, onOpenChange, month, year,
}: { open: boolean; onOpenChange: (v: boolean) => void; month: number; year: number }) {
  const [category, setCategory] = useState("Overall");
  const [amount, setAmount] = useState("");
  const categories = ["Overall", ...DEFAULT_EXPENSE_CATEGORIES.map((c) => c.name)];

  async function handleSave() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");

    const existing = await db.budgets.where({ month, year, category }).first();
    if (existing?.id) {
      await db.budgets.update(existing.id, { amount: amt });
    } else {
      await db.budgets.add({ category, amount: amt, month, year });
    }
    toast.success("Budget saved");
    setAmount("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Set Budget</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Category</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Chip key={c} label={c} selected={category === c} onClick={() => setCategory(c)} />
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Budget Amount</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save Budget</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
