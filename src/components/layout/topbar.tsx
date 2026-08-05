"use client";
import { Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants";
import { ThemeToggle } from "./theme-toggle";

export function Topbar({ onSearch }: { onSearch: () => void }) {
  const pathname = usePathname();
  const current = NAV_ITEMS.find((n) => pathname === n.href || pathname.startsWith(n.href + "/"));

  return (
    <header className="safe-top sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3.5 backdrop-blur md:px-6">
      <h1 className="text-lg font-bold">{current?.label ?? "FinanceFlow"}</h1>
      <div className="flex items-center gap-2">
        <button
          onClick={onSearch}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-muted"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}
