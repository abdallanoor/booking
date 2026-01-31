"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  amountEgp: z
    .number({ message: "Enter a valid amount" })
    .min(1, "Minimum withdrawal is 1 EGP")
    .max(999_999.99, "Amount too large"),
});

type FormValues = z.infer<typeof schema>;

interface RequestPayoutFormProps {
  availableBalanceCents: number;
  onSuccess: () => void;
}

export function RequestPayoutForm({
  availableBalanceCents,
  onSuccess,
}: RequestPayoutFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const maxEgp = availableBalanceCents / 100;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amountEgp: 0 },
  });

  const amountEgp = form.watch("amountEgp");
  const amountCents = Math.round((amountEgp || 0) * 100);
  const exceedsBalance = amountCents > availableBalanceCents && amountCents > 0;
  const canSubmit =
    amountCents >= 100 &&
    amountCents <= availableBalanceCents &&
    !submitting;

  const onSubmit = async (values: FormValues) => {
    const amountCents = Math.round(values.amountEgp * 100);
    setSubmitting(true);
    try {
      const res = await fetch("/api/payouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({ amountCents }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = json.message || json.errors || "Request failed";
        toast.error(typeof msg === "string" ? msg : "Request failed");
        if (
          typeof msg === "string" &&
          msg.toLowerCase().includes("bank")
        ) {
          form.setError("amountEgp", {
            message: "Add bank details in Profile to withdraw.",
          });
        }
        return;
      }

      toast.success("Payout requested. You will be notified when it completes.");
      form.reset({ amountEgp: 0 });
      onSuccess();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Request failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (availableBalanceCents < 100) {
    return (
      <div className="rounded-2xl border bg-card p-6">
        <h3 className="text-lg font-semibold text-foreground">
          Request payout
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          You need at least 1 EGP available to request a payout. Add bank
          details in your{" "}
          <Link href="/profile" className="text-primary underline">
            Profile
          </Link>{" "}
          if you haven’t already.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-6">
      <h3 className="text-lg font-semibold text-foreground">
        Request payout
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Withdraw to your bank account. Min 1 EGP.         Max {formatCurrency(availableBalanceCents, true)}.
      </p>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mt-6 space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="amountEgp">Amount (EGP)</Label>
          <Input
            id="amountEgp"
            type="number"
            step="0.01"
            min={1}
            max={maxEgp}
            placeholder="0.00"
            className={form.formState.errors.amountEgp || exceedsBalance ? "border-destructive" : ""}
            {...form.register("amountEgp", {
              valueAsNumber: true,
            })}
          />
          {(form.formState.errors.amountEgp || exceedsBalance) && (
            <p className="text-xs text-destructive">
              {exceedsBalance
                ? "Amount exceeds available balance"
                : form.formState.errors.amountEgp?.message}
            </p>
          )}
        </div>
        <Button type="submit" disabled={!canSubmit}>
          {submitting ? (
            <>
              <Loader2 className="animate-spin" />
              Requesting…
            </>
          ) : (
            "Request payout"
          )}
        </Button>
      </form>
    </div>
  );
}
