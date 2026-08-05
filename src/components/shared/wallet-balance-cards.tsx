"use client";
import Link from "next/link";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Wallet } from "@/types";
import { useWalletBalance } from "@/hooks/use-wallets";
import { formatCurrencyCompact } from "@/lib/format";
import { WALLET_ICONS } from "@/lib/constants";
import { withAlpha } from "@/lib/utils";

export function WalletBalanceCards({ wallets }: { wallets: Wallet[] }) {
  if (wallets.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-sm font-semibold">Wallet Balances</p>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {wallets.map((w) => (
          <WalletMiniCard key={w.id} wallet={w} />
        ))}
      </div>
    </div>
  );
}

function WalletMiniCard({ wallet }: { wallet: Wallet }) {
  const balance = useWalletBalance(wallet.id);
  const Icon = (Icons as unknown as Record<string, LucideIcon>)[WALLET_ICONS[wallet.type]] ?? Icons.Wallet;

  return (
    <Link
      href={`/wallets/${wallet.id}`}
      className="flex w-36 shrink-0 flex-col gap-2 rounded-2xl border border-border bg-card p-3.5 active:scale-[0.98] transition-transform"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: withAlpha(wallet.color) }}>
        <Icon className="h-4 w-4" style={{ color: wallet.color }} />
      </div>
      <div>
        <p className="truncate text-xs text-muted-foreground">{wallet.name}</p>
        <p className="truncate text-base font-bold">{formatCurrencyCompact(balance)}</p>
      </div>
    </Link>
  );
}
