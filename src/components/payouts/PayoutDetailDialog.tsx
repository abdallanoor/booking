"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PayoutDetail {
  _id: string;
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

interface PayoutDetailDialogProps {
  payout: PayoutDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PayoutDetailDialog({
  payout,
  open,
  onOpenChange,
}: PayoutDetailDialogProps) {
  if (!payout) return null;

  const statusVariant =
    payout.status === "failed"
      ? "destructive"
      : payout.status === "success"
        ? "default"
        : "secondary";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Payout details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold">
              {formatCurrency(payout.amountCents, true)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={statusVariant}>{payout.status}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Requested</span>
            <span>{formatDate(payout.createdAt, "PPP p")}</span>
          </div>
          {payout.paymobEventAt && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Last update</span>
              <span>{formatDate(payout.paymobEventAt, "PPP p")}</span>
            </div>
          )}
          {payout.paymobStatusDescription && (
            <div className="pt-2 border-t">
              <p className="text-muted-foreground mb-1">Provider message</p>
              <p className="text-foreground">{payout.paymobStatusDescription}</p>
            </div>
          )}
          {payout.paymobTransactionId && (
            <div className="pt-2 border-t">
              <p className="text-muted-foreground mb-1">Transaction ID</p>
              <p className="font-mono text-xs break-all">
                {payout.paymobTransactionId}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
