"use client";
import { useMemo, useState } from "react";
import * as Icons from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/schema";
import { formatCurrency, formatMonthYear } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function CalendarView() {
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState<Date>(new Date());

  const transactions = useLiveQuery(() => db.transactions.toArray(), []) ?? [];
  const loans = useLiveQuery(() => db.loans.toArray(), []) ?? [];
  const reminders = useLiveQuery(() => db.reminders.toArray(), []) ?? [];
  const wallets = useLiveQuery(() => db.wallets.toArray(), []) ?? [];
  const walletName = (id: number) => wallets.find((w) => w.id === id)?.name ?? "—";

  const eventDates = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => set.add(new Date(t.date).toDateString()));
    loans.forEach((l) => l.dueDate && set.add(new Date(l.dueDate).toDateString()));
    reminders.forEach((r) => r.dueDate && set.add(new Date(r.dueDate).toDateString()));
    return set;
  }, [transactions, loans, reminders]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  const dayTxns = transactions.filter((t) => sameDay(new Date(t.date), selected));
  const dayLoans = loans.filter((l) => l.dueDate && sameDay(new Date(l.dueDate), selected));
  const dayReminders = reminders.filter((r) => r.dueDate && sameDay(new Date(r.dueDate), selected));

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setCursor(new Date(year, month - 1, 1))}>
            <Icons.ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="text-sm font-semibold">{formatMonthYear(cursor)}</p>
          <Button variant="ghost" size="icon" onClick={() => setCursor(new Date(year, month + 1, 1))}>
            <Icons.ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i}>{d}</div>)}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const isSelected = sameDay(d, selected);
            const isToday = sameDay(d, new Date());
            const hasEvent = eventDates.has(d.toDateString());
            return (
              <button
                key={i}
                onClick={() => setSelected(d)}
                className={cn(
                  "relative flex h-9 flex-col items-center justify-center rounded-lg text-sm transition-colors",
                  isSelected ? "bg-primary text-primary-foreground font-semibold" : isToday ? "bg-primary/10 text-primary" : "hover:bg-muted"
                )}
              >
                {d.getDate()}
                {hasEvent && !isSelected && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-accent" />}
              </button>
            );
          })}
        </div>
      </div>

      {dayTxns.length === 0 && dayLoans.length === 0 && dayReminders.length === 0 ? (
        <EmptyState icon="CalendarCheck" title="No records for this day" message="Income, expenses, loan dues, and bike service dates will show up here." />
      ) : (
        <div className="space-y-2">
          {dayTxns.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
              <div>
                <p className="text-sm font-medium">{t.category}</p>
                <p className="text-xs text-muted-foreground">{walletName(t.walletId)}</p>
              </div>
              <p className={`text-sm font-semibold ${t.type === "income" ? "text-income" : "text-expense"}`}>
                {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
              </p>
            </div>
          ))}
          {dayLoans.map((l) => (
            <div key={l.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
              <div>
                <p className="text-sm font-medium">Loan due: {l.person}</p>
                <p className="text-xs text-muted-foreground">{l.direction === "given" ? "They owe you" : "You owe them"}</p>
              </div>
              <p className="text-sm font-semibold">{formatCurrency(l.amount - l.paidAmount)}</p>
            </div>
          ))}
          {dayReminders.map((r) => (
            <div key={r.id} className="flex items-center gap-2 rounded-xl border border-border bg-card p-3">
              <Icons.BellRing className="h-4 w-4 text-amber-500" />
              <p className="text-sm font-medium">{r.title}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
