"use client";

import { useState, useEffect, useCallback } from "react";
import { Receipt, AlertCircle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { PayoutDetailDialog } from "./PayoutDetailDialog";

interface PayoutItem {
  _id: string;
  host: string;
  amountCents: number;
  currency: string;
  status: string;
  paymobStatus?: string;
  paymobStatusDescription?: string;
  paymobStatusCode?: string;
  paymobEventAt?: string | null;
  paymobTransactionId?: string;
  createdAt: string;
  updatedAt: string;
}

type StatusTab = "all" | "pending" | "success" | "failed";

interface PayoutHistoryProps {
  refreshTrigger?: number;
}

export function PayoutHistory({ refreshTrigger = 0 }: PayoutHistoryProps) {
  const [tab, setTab] = useState<StatusTab>("all");
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailPayout, setDetailPayout] = useState<PayoutItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: "1", limit: "20" });
      if (tab !== "all") params.set("status", tab);
      const res = await fetch(`/api/payouts?${params.toString()}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || "Failed to load payouts");
      }
      const json = await res.json();
      setPayouts(json.data?.payouts ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load payouts");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts, refreshTrigger]);

  const openDetail = (p: PayoutItem) => {
    setDetailPayout(p);
    setDetailOpen(true);
  };

  const statusVariant = (status: string) =>
    status === "failed"
      ? "destructive"
      : status === "success"
        ? "default"
        : "secondary";

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">
          Payout history
        </h3>
        <p className="text-sm text-muted-foreground">
          View status and details of your withdrawals.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as StatusTab)}>
        <TabsList className="grid w-full max-w-md grid-cols-4 bg-muted/50 p-1">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="success">Success</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading && !payouts.length ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : error && !payouts.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => fetchPayouts()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : payouts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-muted/30 p-4 rounded-full mb-4">
              <Receipt className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">No payouts yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              {tab === "all"
                ? "Your payout history will appear here."
                : `No ${tab} payouts.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {payouts.map((p) => (
            <Card
              key={p._id}
              className="cursor-pointer transition-colors hover:bg-muted/30"
              onClick={() => openDetail(p)}
            >
              <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4">
                <div className="space-y-1">
                  <p className="font-semibold">
                    {formatCurrency(p.amountCents, true)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(p.createdAt, "PPP")}
                  </p>
                </div>
                <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PayoutDetailDialog
        payout={detailPayout}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
