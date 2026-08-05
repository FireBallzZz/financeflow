import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0-1
  className?: string;
  barClassName?: string;
}

/** Simple div-based progress bar — no Radix needed for this one. */
export function ProgressBar({ value, className, barClassName }: ProgressBarProps) {
  const pct = Math.min(Math.max(value, 0), 1) * 100;
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className={cn("h-full rounded-full bg-primary transition-all duration-500", barClassName)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
