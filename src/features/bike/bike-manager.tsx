"use client";
import { useState } from "react";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { db } from "@/db/schema";
import { toast } from "sonner";
import type { FuelLog, MaintenanceLog } from "@/types";
import { useVehicles, useFuelLogs, useMaintenanceLogs, useBikeCosts } from "@/hooks/use-bike";
import { useReminders } from "@/hooks/use-reminders";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { BIKE_MAINTENANCE_LABELS, BIKE_MAINTENANCE_ICONS } from "@/lib/constants";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FuelForm } from "./fuel-form";
import { MaintenanceForm } from "./maintenance-form";
import { ReminderForm, REMINDER_CATEGORY_LABELS } from "@/features/settings/reminder-form";

export function BikeManager() {
  const vehicles = useVehicles();
  const vehicleId = vehicles[0]?.id;
  const costs = useBikeCosts();
  const [tab, setTab] = useState("fuel");

  if (!vehicleId) return <EmptyState icon="Bike" title="Setting up..." message="Your bike profile is being created." />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="This Month" amount={costs.monthlyCost} icon="Calendar" color="hsl(var(--bike))" />
        <StatCard label="Total Bike Cost" amount={costs.totalCost} icon="PiggyBank" color="hsl(var(--primary))" />
      </div>
      {costs.avgMileage !== null && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Average Mileage</p>
            <p className="text-lg font-bold">{costs.avgMileage.toFixed(1)} km/L</p>
          </div>
          {costs.fuelCostPerKm !== null && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Fuel Cost / km</p>
              <p className="text-lg font-bold">{formatCurrency(costs.fuelCostPerKm)}</p>
            </div>
          )}
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full">
          <TabsTrigger value="fuel" className="flex-1">Fuel Log</TabsTrigger>
          <TabsTrigger value="maintenance" className="flex-1">Maintenance</TabsTrigger>
          <TabsTrigger value="reminders" className="flex-1">Reminders</TabsTrigger>
        </TabsList>
        <TabsContent value="fuel"><FuelTab vehicleId={vehicleId} /></TabsContent>
        <TabsContent value="maintenance"><MaintenanceTab vehicleId={vehicleId} /></TabsContent>
        <TabsContent value="reminders"><BikeReminders /></TabsContent>
      </Tabs>
    </div>
  );
}

function FuelTab({ vehicleId }: { vehicleId: number }) {
  const logs = useFuelLogs();
  const [formTarget, setFormTarget] = useState<FuelLog | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<FuelLog | null>(null);

  return (
    <div className="space-y-3">
      <Button onClick={() => setFormTarget(null)} className="w-full"><Icons.Plus className="h-4 w-4" /> Add Fuel Log</Button>
      {logs.length === 0 ? (
        <EmptyState icon="Fuel" title="No fuel logs yet" message="Track every fill-up to see mileage and fuel cost trends." />
      ) : (
        <div className="space-y-2">
          {logs.map((f) => (
            <div key={f.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
                <Icons.Fuel className="h-4.5 w-4.5 text-amber-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{f.liters.toFixed(2)} L @ {formatCurrency(f.pricePerLiter)}/L</p>
                <p className="text-xs text-muted-foreground">{f.odometer.toFixed(0)} km • {formatDateShort(f.date)}</p>
              </div>
              <p className="text-sm font-bold">{formatCurrency(f.amount)}</p>
              <button onClick={() => setFormTarget(f)} className="rounded-lg p-2.5 -m-1 text-muted-foreground hover:bg-muted"><Icons.Pencil className="h-4 w-4" /></button>
              <button onClick={() => setDeleteTarget(f)} className="rounded-lg p-2.5 -m-1 text-muted-foreground hover:bg-muted"><Icons.Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
      <FuelForm open={formTarget !== undefined} onOpenChange={(v) => !v && setFormTarget(undefined)} vehicleId={vehicleId} editLog={formTarget} />
      <ConfirmDialog
        open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete fuel log?" description="This cannot be undone." destructive confirmLabel="Delete"
        onConfirm={async () => {
          if (deleteTarget?.id) {
            await db.transaction("rw", [db.fuelLogs, db.transactions], async () => {
              if (deleteTarget.transactionId) await db.transactions.delete(deleteTarget.transactionId);
              await db.fuelLogs.delete(deleteTarget.id!);
            });
            toast.success("Deleted");
          }
        }}
      />
    </div>
  );
}

function MaintenanceTab({ vehicleId }: { vehicleId: number }) {
  const logs = useMaintenanceLogs();
  const [formTarget, setFormTarget] = useState<MaintenanceLog | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<MaintenanceLog | null>(null);

  return (
    <div className="space-y-3">
      <Button onClick={() => setFormTarget(null)} className="w-full"><Icons.Plus className="h-4 w-4" /> Add Maintenance</Button>
      {logs.length === 0 ? (
        <EmptyState icon="Wrench" title="No maintenance records" message="Log oil changes, tyres, brake pads and more to track upkeep costs." />
      ) : (
        <div className="space-y-2">
          {logs.map((m) => {
            const Icon = (Icons as unknown as Record<string, LucideIcon>)[BIKE_MAINTENANCE_ICONS[m.type]] ?? Icons.Wrench;
            return (
              <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bike/15">
                  <Icon className="h-4.5 w-4.5 text-bike" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{BIKE_MAINTENANCE_LABELS[m.type]}</p>
                  <p className="text-xs text-muted-foreground">{formatDateShort(m.date)}</p>
                </div>
                <p className="text-sm font-bold">{formatCurrency(m.amount)}</p>
                <button onClick={() => setFormTarget(m)} className="rounded-lg p-2.5 -m-1 text-muted-foreground hover:bg-muted"><Icons.Pencil className="h-4 w-4" /></button>
                <button onClick={() => setDeleteTarget(m)} className="rounded-lg p-2.5 -m-1 text-muted-foreground hover:bg-muted"><Icons.Trash2 className="h-4 w-4" /></button>
              </div>
            );
          })}
        </div>
      )}
      <MaintenanceForm open={formTarget !== undefined} onOpenChange={(v) => !v && setFormTarget(undefined)} vehicleId={vehicleId} editLog={formTarget} />
      <ConfirmDialog
        open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete maintenance record?" description="This cannot be undone." destructive confirmLabel="Delete"
        onConfirm={async () => {
          if (deleteTarget?.id) {
            await db.transaction("rw", [db.maintenanceLogs, db.transactions], async () => {
              if (deleteTarget.transactionId) await db.transactions.delete(deleteTarget.transactionId);
              await db.maintenanceLogs.delete(deleteTarget.id!);
            });
            toast.success("Deleted");
          }
        }}
      />
    </div>
  );
}

function BikeReminders() {
  const reminders = useReminders();
  const bikeReminders = reminders.filter((r) => r.category.startsWith("bike_"));
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="space-y-3">
      <Button onClick={() => setFormOpen(true)} className="w-full"><Icons.Plus className="h-4 w-4" /> New Bike Reminder</Button>
      {bikeReminders.length === 0 ? (
        <EmptyState icon="BellRing" title="No bike reminders" message="Set reminders for oil change, insurance, or registration by date or odometer reading." />
      ) : (
        <div className="space-y-2">
          {bikeReminders.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <Icons.BellRing className="h-5 w-5 shrink-0 text-amber-500" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{r.title}</p>
                <p className="text-xs text-muted-foreground">
                  {REMINDER_CATEGORY_LABELS[r.category]}
                  {r.dueDate && ` • Due ${formatDateShort(r.dueDate)}`}
                  {r.dueOdometer && ` • At ${r.dueOdometer} km`}
                </p>
              </div>
              <button onClick={async () => { if (r.id) await db.reminders.delete(r.id); }} className="rounded-lg p-2.5 -m-1 text-muted-foreground hover:bg-muted">
                <Icons.Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      <ReminderForm open={formOpen} onOpenChange={setFormOpen} defaultCategory="bike_service" />
    </div>
  );
}
