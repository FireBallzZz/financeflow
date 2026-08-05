"use client";
import { useState } from "react";
import Link from "next/link";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Wallet } from "@/types";
import { useWallets, useWalletBalance } from "@/hooks/use-wallets";
import { formatCurrency } from "@/lib/format";
import { WALLET_ICONS } from "@/lib/constants";
import { withAlpha } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { WalletForm } from "./wallet-form";
import { TransferForm } from "./transfer-form";

export function WalletList() {
  const wallets = useWallets();
  const [editWallet, setEditWallet] = useState<Wallet | null | undefined>(undefined);
  const [transferOpen, setTransferOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button onClick={() => setEditWallet(null)} className="flex-1">
          <Icons.Plus className="h-4 w-4" /> New Wallet
        </Button>
        <Button variant="outline" onClick={() => setTransferOpen(true)} className="flex-1">
          <Icons.ArrowLeftRight className="h-4 w-4" /> Transfer
        </Button>
      </div>

      {wallets.length === 0 ? (
        <EmptyState icon="Wallet" title="No wallets yet" message="Add a wallet to start tracking balances." />
      ) : (
        <div className="space-y-2">
          {wallets.map((w) => (
            <WalletRow key={w.id} wallet={w} onEdit={() => setEditWallet(w)} />
          ))}
        </div>
      )}

      <WalletForm open={editWallet !== undefined} onOpenChange={(v) => !v && setEditWallet(undefined)} editWallet={editWallet} />
      <TransferForm open={transferOpen} onOpenChange={setTransferOpen} />
    </div>
  );
}

function WalletRow({ wallet, onEdit }: { wallet: Wallet; onEdit: () => void }) {
  const balance = useWalletBalance(wallet.id);
  const Icon = (Icons as unknown as Record<string, LucideIcon>)[WALLET_ICONS[wallet.type]] ?? Icons.Wallet;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <Link href={`/wallets/${wallet.id}`} className="flex flex-1 items-center gap-3 min-w-0">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: withAlpha(wallet.color) }}>
          <Icon className="h-5 w-5" style={{ color: wallet.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold">{wallet.name}</p>
            {wallet.isDefault && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">Default</span>
            )}
          </div>
          <p className="text-lg font-bold">{formatCurrency(balance)}</p>
        </div>
      </Link>
      <button onClick={onEdit} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
        <Icons.Pencil className="h-4 w-4" />
      </button>
    </div>
  );
}
