import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatCurrencyCompact } from "@/lib/format";
import { cn, withAlpha } from "@/lib/utils";

interface StatCardProps {
  label: string;
  amount: number;
  icon: string;
  color: string;
  subtitle?: string;
  onClick?: () => void;
  className?: string;
}

export function StatCard({ label, amount, icon, color, subtitle, onClick, className }: StatCardProps) {
  const Icon = (Icons as unknown as Record<string, LucideIcon>)[icon] ?? Icons.Circle;
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-transform",
        onClick && "active:scale-[0.98] hover:shadow-md",
        className
      )}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: withAlpha(color) }}>
        <Icon className="h-4.5 w-4.5" style={{ color }} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-lg font-bold">{formatCurrencyCompact(amount)}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </Comp>
  );
}