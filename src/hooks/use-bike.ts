"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/schema";

export function useVehicles() {
  return useLiveQuery(() => db.vehicles.toArray(), []) ?? [];
}

export function useFuelLogs() {
  return useLiveQuery(() => db.fuelLogs.orderBy("date").reverse().toArray(), []) ?? [];
}

export function useMaintenanceLogs() {
  return useLiveQuery(() => db.maintenanceLogs.orderBy("date").reverse().toArray(), []) ?? [];
}

export function useBikeCosts() {
  return (
    useLiveQuery(async () => {
      const [fuel, maint] = await Promise.all([db.fuelLogs.toArray(), db.maintenanceLogs.toArray()]);
      const now = new Date();
      const inThisMonth = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      };
      const totalFuel = fuel.reduce((s, f) => s + f.amount, 0);
      const totalMaint = maint.reduce((s, m) => s + m.amount, 0);
      const monthFuel = fuel.filter((f) => inThisMonth(f.date)).reduce((s, f) => s + f.amount, 0);
      const monthMaint = maint.filter((m) => inThisMonth(m.date)).reduce((s, m) => s + m.amount, 0);

      // Average mileage: total km covered between first and last odometer
      // reading, divided by total liters (excluding the very first fill-up,
      // which has no "distance since last fill" to attribute).
      const sorted = [...fuel].sort((a, b) => a.odometer - b.odometer);
      let avgMileage: number | null = null;
      if (sorted.length >= 2) {
        const totalKm = sorted[sorted.length - 1].odometer - sorted[0].odometer;
        const litersExcludingFirst = sorted.slice(1).reduce((s, f) => s + f.liters, 0);
        avgMileage = litersExcludingFirst > 0 ? totalKm / litersExcludingFirst : null;
      }
      const fuelCostPerKm =
        avgMileage && avgMileage > 0 && sorted.length >= 2
          ? (sorted[sorted.length - 1].odometer - sorted[0].odometer) > 0
            ? fuel.slice(1).reduce((s, f) => s + f.amount, 0) /
              (sorted[sorted.length - 1].odometer - sorted[0].odometer)
            : null
          : null;

      return {
        totalCost: totalFuel + totalMaint,
        monthlyCost: monthFuel + monthMaint,
        totalFuel,
        totalMaintenance: totalMaint,
        avgMileage,
        fuelCostPerKm,
      };
    }, []) ?? {
      totalCost: 0,
      monthlyCost: 0,
      totalFuel: 0,
      totalMaintenance: 0,
      avgMileage: null as number | null,
      fuelCostPerKm: null as number | null,
    }
  );
}
