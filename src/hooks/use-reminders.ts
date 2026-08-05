"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/schema";

export function useReminders() {
  return useLiveQuery(() => db.reminders.orderBy("dueDate").toArray(), []) ?? [];
}

export function useUpcomingReminders(limit = 5) {
  return (
    useLiveQuery(async () => {
      // IndexedDB doesn't reliably support boolean values as index keys
      // across browsers, so we fetch everything and filter/sort in JS
      // instead of using .where("isActive").equals(true).
      const all = await db.reminders.toArray();
      const withDue = all.filter((r) => r.isActive && r.dueDate);
      withDue.sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
      return withDue.slice(0, limit);
    }, [limit]) ?? []
  );
}
