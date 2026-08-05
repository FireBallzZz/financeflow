"use client";
import Link from "next/link";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { withAlpha } from "@/lib/utils";

const ITEMS = [
  { href: "/wallets", label: "Wallets", icon: "WalletCards", color: "hsl(var(--primary))" },
  { href: "/loans", label: "Loan Tracker", icon: "HandCoins", color: "#06b6d4" },
  { href: "/budgets", label: "Budget Planner", icon: "PieChart", color: "hsl(var(--accent))" },
  { href: "/bike", label: "Bike Manager", icon: "Bike", color: "hsl(var(--bike))" },
  { href: "/calendar", label: "Calendar", icon: "CalendarDays", color: "hsl(var(--secondary))" },
  { href: "/settings", label: "Settings", icon: "Settings", color: "hsl(var(--income))" },
];

export default function MorePage() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {ITEMS.map((item) => {
        const Icon = (Icons as unknown as Record<string, LucideIcon>)[item.icon] ?? Icons.Circle;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm active:scale-[0.98] transition-transform"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: withAlpha(item.color) }}>
              <Icon className="h-5 w-5" style={{ color: item.color }} />
            </div>
            <p className="text-sm font-semibold">{item.label}</p>
          </Link>
        );
      })}
    </div>
  );
}
