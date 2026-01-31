"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { WalletSummary } from "./WalletSummary";
import { RequestPayoutForm } from "./RequestPayoutForm";
import { PayoutHistory } from "./PayoutHistory";

export function WalletAndPayoutsSection() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [availableBalanceCents, setAvailableBalanceCents] = useState(0);
  const [walletLoaded, setWalletLoaded] = useState(false);



  const handleRefresh = useCallback(() => {
    setRefreshTrigger((k) => k + 1);
  }, []);

  const handleWalletLoaded = useCallback(
    (data: { availableBalanceCents: number }) => {
      setAvailableBalanceCents(data.availableBalanceCents);
      setWalletLoaded(true);
    },
    []
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Wallet & payouts
        </h2>
        <p className="text-muted-foreground">
          View your balance and request withdrawals to your bank account.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <WalletSummary
            refreshTrigger={refreshTrigger}
            onLoaded={handleWalletLoaded}
          />
        </div>
        <div className="lg:col-span-2">
          {walletLoaded ? (
            <RequestPayoutForm
              availableBalanceCents={availableBalanceCents}
              onSuccess={handleRefresh}
            />
          ) : (
            <div className="rounded-2xl border bg-card p-6 animate-pulse">
              <div className="h-5 w-32 bg-muted rounded" />
              <div className="mt-4 h-10 w-24 bg-muted rounded" />
            </div>
          )}
        </div>
      </div>

      <PayoutHistory refreshTrigger={refreshTrigger} />
    </div>
  );
}
