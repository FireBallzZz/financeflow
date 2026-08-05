import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  const Icon = (Icons as unknown as Record<string, LucideIcon>)[icon] ?? Icons.Inbox;
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <Icon className="h-9 w-9 text-primary" />
      </div>
      <div className="space-y-1">
        <p className="font-semibold">{title}</p>
        <p className="max-w-xs text-sm text-muted-foreground">{message}</p>
      </div>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-1">
          <Icons.Plus className="h-4 w-4" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
