"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface WalletData {
  walletBalanceCents: number;
  pendingPayoutCents: number;
  availableBalanceCents: number;
}

interface WalletSummaryProps {
  refreshTrigger?: number;
  onLoaded?: (data: WalletData) => void;
}

export function WalletSummary({
  refreshTrigger = 0,
  onLoaded,
}: WalletSummaryProps) {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWallet = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/user/wallet");
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || "Failed to load wallet");
      }
      const json = await res.json();
      const wallet = json.data as WalletData;
      setData(wallet);
      onLoaded?.(wallet);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load wallet");
    } finally {
      setLoading(false);
    }
  }, [onLoaded]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet, refreshTrigger]);

  if (loading && !data) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-sm font-medium text-muted-foreground">
          Available balance
        </h3>
        <Skeleton className="mt-2 h-9 w-32" />
        <Skeleton className="mt-1 h-4 w-48" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-card p-6">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm font-medium">{error}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => fetchWallet()}
        >
          Retry
        </Button>
      </div>
    );
  }

  const wallet = data!;



  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="text-sm font-medium text-muted-foreground">
        Available balance
      </h3>
      <p className="mt-2 text-3xl font-bold">
        {formatCurrency(wallet.availableBalanceCents, true)}
      </p>
      {wallet.pendingPayoutCents > 0 && (
        <p className="mt-1 text-xs text-muted-foreground">
          Pending payouts: {formatCurrency(wallet.pendingPayoutCents, true)}
        </p>
      )}
      {!wallet.pendingPayoutCents && wallet.walletBalanceCents > 0 && (
        <p className="mt-1 text-xs text-muted-foreground">
          Ready to withdraw
        </p>
      )}
      {/* Backfilling logic removed */}
      {/* Optionally, you can show a message here if needed */}
    </div>
  );
}
