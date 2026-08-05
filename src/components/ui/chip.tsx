"use client";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  color?: string;
  icon?: string;
  className?: string;
}

/** Pill-shaped selectable chip used for category/wallet/type pickers throughout the app. */
export function Chip({ label, selected, onClick, color, icon, className }: ChipProps) {
  const Icon = icon ? ((Icons as unknown as Record<string, LucideIcon>)[icon] ?? null) : null;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
        selected
          ? "border-transparent text-white shadow-sm"
          : "border-border bg-muted/50 text-foreground hover:bg-muted",
        className
      )}
      style={selected ? { backgroundColor: color ?? "hsl(var(--primary))" } : undefined}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}
