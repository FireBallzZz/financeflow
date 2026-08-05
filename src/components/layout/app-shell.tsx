"use client";
import { useState } from "react";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import { Topbar } from "./topbar";
import { QuickAddSheet } from "./quick-add-sheet";
import { GlobalSearch } from "@/features/search/global-search";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex min-w-0 min-h-screen flex-1 flex-col">
        <Topbar onSearch={() => setSearchOpen(true)} />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-24 pt-4 md:px-6 md:pb-8">{children}</main>
      </div>
      <div className="md:hidden">
        <BottomNav onQuickAdd={() => setQuickAddOpen(true)} />
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      <QuickAddSheet open={quickAddOpen} onOpenChange={setQuickAddOpen} />
    </div>
  );
}

