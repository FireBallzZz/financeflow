"use client";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const options = [
    { value: "light" as const, icon: Sun },
    { value: "dark" as const, icon: Moon },
    { value: "system" as const, icon: Monitor },
  ];
  return (
    <div className="inline-flex items-center rounded-full border border-border bg-muted/50 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
            theme === opt.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}
          aria-label={opt.value}
        >
          <opt.icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
