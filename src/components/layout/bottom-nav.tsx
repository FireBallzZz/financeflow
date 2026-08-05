"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MOBILE_NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function BottomNav({ onQuickAdd }: { onQuickAdd: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden">
      {/*
        Every slot uses flex-1 (not a fixed pixel width) so the bar always
        exactly fits the viewport, from the smallest phones (~320px) up —
        a fixed-width row here previously overflowed on narrow screens.
      */}
      <div className="mx-auto flex h-16 max-w-lg items-center px-1">
        {MOBILE_NAV_ITEMS.slice(0, 2).map((item) => (
          <NavButton key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}

        {/* Center floating add button */}
        <div className="flex flex-1 justify-center">
          <button
            onClick={onQuickAdd}
            className="-mt-8 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 active:scale-95 transition-transform"
            aria-label="Add"
          >
            <Icons.Plus className="h-7 w-7" />
          </button>
        </div>

        {MOBILE_NAV_ITEMS.slice(2).map((item) => (
          <NavButton key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}
      </div>
    </nav>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/more") {
    // "More" covers every section not directly in the bottom bar.
    const directHrefs = ["/dashboard", "/transactions", "/analytics"];
    return !directHrefs.some((h) => pathname.startsWith(h));
  }
  return pathname === href || pathname.startsWith(href + "/");
}

function NavButton({ item, active }: { item: (typeof MOBILE_NAV_ITEMS)[number]; active: boolean }) {
  const Icon = (Icons as unknown as Record<string, LucideIcon>)[item.icon];
  return (
    <Link
      href={item.href}
      className={cn(
        "flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition-colors",
        active ? "text-primary" : "text-muted-foreground"
      )}
    >
      <Icon className="h-[22px] w-[22px]" />
      {item.label}
    </Link>
  );
}