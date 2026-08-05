import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Standard shadcn/ui class-merging helper. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Generates a per-session-unique id string, used for grouping transfer legs. */
export function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * A transaction is a transfer leg if it has a transferId. Transfers move
 * money between the user's own wallets and must NEVER be counted in
 * aggregate "Total Income" / "Total Expense" stats, category breakdowns,
 * budgets, or insights — they net to zero and aren't real income/spending.
 * They DO still affect individual wallet balances (that's the whole point).
 */
export function isTransfer(t: { transferId?: string }): boolean {
  return !!t.transferId;
}

/**
 * Produces a translucent version of a color for use as a soft icon-badge
 * background. Handles two color formats used throughout the app:
 *  - hex strings from lib/constants.ts, e.g. "#f59e0b" -> append hex alpha
 *  - CSS custom-property strings, e.g. "hsl(var(--income))" -> use the
 *    modern hsl(... / alpha) syntax instead, since you can't safely
 *    string-concat alpha onto a var() reference.
 */
export function withAlpha(color: string, alpha: number = 0.125): string {
  if (color.startsWith("hsl(var(")) {
    // "hsl(var(--income))" -> "hsl(var(--income) / 0.125)"
    return color.replace(/\)\s*$/, ` / ${alpha})`);
  }
  if (color.startsWith("#")) {
    const hex = Math.round(alpha * 255).toString(16).padStart(2, "0");
    return `${color}${hex}`;
  }
  return color;
}
