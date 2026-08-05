"use client";
import { useState } from "react";
import { toast } from "sonner";
import { db } from "@/db/schema";
import type { ReminderCategory, ReminderTrigger } from "@/types";
import { showLocalNotification } from "@/lib/notifications";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Chip } from "@/components/ui/chip";
import { Switch } from "@/components/ui/switch";

const CATEGORY_LABELS: Record<ReminderCategory, string> = {
  loan_due: "Loan Due",
  bike_service: "Bike Service",
  bike_insurance: "Insurance Renewal",
  bike_registration: "Registration Renewal",
  budget: "Monthly Budget",
  savings_goal: "Savings Goal",
  custom: "Custom",
};

export function ReminderForm({
  open, onOpenChange, defaultCategory,
}: { open: boolean; onOpenChange: (v: boolean) => void; defaultCategory?: ReminderCategory }) {
  const [category, setCategory] = useState<ReminderCategory>(defaultCategory ?? "custom");
  const [title, setTitle] = useState("");
  const [trigger, setTrigger] = useState<ReminderTrigger>("date");
  const [dueDate, setDueDate] = useState("");
  const [dueOdometer, setDueOdometer] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);

  async function handleSave() {
    if (!title.trim()) return toast.error("Enter a title");
    if (trigger === "date" && !dueDate) return toast.error("Pick a due date");
    if (trigger === "odometer" && !dueOdometer) return toast.error("Enter a target odometer reading");

    await db.reminders.add({
      category, title: title.trim(), trigger,
      dueDate: trigger === "date" ? new Date(dueDate).toISOString() : undefined,
      dueOdometer: trigger === "odometer" ? parseFloat(dueOdometer) : undefined,
      isRecurring, isActive: true, createdAt: new Date().toISOString(),
    });

    showLocalNotification("Reminder created", title.trim());
    toast.success("Reminder saved");
    setTitle(""); setDueDate(""); setDueOdometer("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New Reminder</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(CATEGORY_LABELS) as ReminderCategory[]).map((c) => (
              <Chip key={c} label={CATEGORY_LABELS[c]} selected={category === c} onClick={() => setCategory(c)} />
            ))}
          </div>
          <div className="space-y-1.5"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>

          <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
            <button onClick={() => setTrigger("date")} className={`rounded-lg py-2 text-sm font-medium ${trigger === "date" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>By Date</button>
            <button onClick={() => setTrigger("odometer")} className={`rounded-lg py-2 text-sm font-medium ${trigger === "odometer" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>By Odometer</button>
          </div>

          {trigger === "date" ? (
            <div className="space-y-1.5"><Label>Due Date</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
          ) : (
            <div className="space-y-1.5"><Label>Target Odometer (km)</Label><Input type="number" value={dueOdometer} onChange={(e) => setDueOdometer(e.target.value)} placeholder="e.g. current + 2000" /></div>
          )}

          <div className="flex items-center justify-between rounded-xl border border-border p-3">
            <Label htmlFor="recurring" className="cursor-pointer">Repeat monthly</Label>
            <Switch id="recurring" checked={isRecurring} onCheckedChange={setIsRecurring} />
          </div>
        </div>
        <DialogFooter><Button onClick={handleSave}>Save Reminder</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { CATEGORY_LABELS as REMINDER_CATEGORY_LABELS };
