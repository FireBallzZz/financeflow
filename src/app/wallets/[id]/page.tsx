"use client";
import { useParams } from "next/navigation";
import { WalletDetailView } from "@/features/wallets/wallet-detail-view";

export default function WalletDetailPage() {
  const params = useParams<{ id: string }>();
  const walletId = Number(params.id);
  return <WalletDetailView walletId={walletId} />;
}
