"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateUserAction } from "@/actions";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Save as SaveIcon } from "lucide-react";
import type { User } from "@/types";

// User type from AuthContext uses 'id' instead of '_id'
type ClientUser = Omit<User, "_id"> & { id?: string; _id?: string };

interface BankDetailsProps {
  user: ClientUser;
  refreshUser: () => Promise<void>;
}

export function BankDetails({ user, refreshUser }: BankDetailsProps) {
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const isHostOrAdmin = user.role === "Host" || user.role === "Admin";

  const handleFormChange = () => {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);

    let hasChanged = false;

    if (isHostOrAdmin) {
      const currentValues = {
        bankName: formData.get("bankName") as string,
        accountNumber: formData.get("accountNumber") as string,
        routingNumber: formData.get("routingNumber") as string,
      };
      const initialValues = {
        bankName: user.bankDetails?.bankName || "",
        accountNumber: user.bankDetails?.accountNumber || "",
        routingNumber: user.bankDetails?.routingNumber || "",
      };
      hasChanged =
        JSON.stringify(currentValues) !== JSON.stringify(initialValues);
    } else {
      const cardNumber = formData.get("cardNumber") as string;
      const expiry = formData.get("expiry") as string;
      const cvc = formData.get("cvc") as string;
      hasChanged = !!cardNumber || !!expiry || !!cvc;
    }

    setIsDirty(hasChanged);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      let result;
      if (isHostOrAdmin) {
        const bankDetails = {
          bankName: formData.get("bankName") as string,
          accountNumber: formData.get("accountNumber") as string,
          routingNumber: formData.get("routingNumber") as string,
        };
        result = await updateUserAction({
          name: user.name,
          bankDetails,
        });
      } else {
        const cardNumber = formData.get("cardNumber") as string;
        result = await updateUserAction({
          name: user.name,
          creditCard: {
            lastFour: cardNumber.slice(-4),
            provider: "Visa", // Mock provider
          },
        });
      }

      if (result.success) {
        toast.success("Payment details updated successfully");
        await refreshUser();
        if (!isHostOrAdmin && formRef.current) {
          formRef.current.reset();
        }
        setIsDirty(false);
      } else {
        toast.error(result.message || "Failed to update payment details");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 border-t border-border">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {isHostOrAdmin ? "Bank Details" : "Payment Method"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isHostOrAdmin
              ? "Add your bank information to receive payouts."
              : "Manage your saved credit cards for faster checkout."}
          </p>
        </div>
        <Button
          form="bank-details-form"
          type="submit"
          disabled={loading || !isDirty}
          className="max-sm:h-10"
          variant="secondary"
        >
          {loading ? <Loader2 className="animate-spin" /> : <SaveIcon />}
          <span className="hidden sm:inline">Save</span>
        </Button>
      </div>

      <form
        id="bank-details-form"
        ref={formRef}
        onChange={handleFormChange}
        onSubmit={handleUpdate}
        className="space-y-6"
      >
        {isHostOrAdmin ? (
          <div className="grid gap-6">
            <div className="space-y-2">
              <Label htmlFor="bankName" className="text-sm font-medium">
                Bank Name
              </Label>
              <Input
                id="bankName"
                name="bankName"
                defaultValue={user.bankDetails?.bankName}
                placeholder="e.g. Chase Bank"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="accountNumber" className="text-sm font-medium">
                  Account Number
                </Label>
                <Input
                  id="accountNumber"
                  name="accountNumber"
                  defaultValue={user.bankDetails?.accountNumber}
                  placeholder="0000000000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="routingNumber" className="text-sm font-medium">
                  Routing Number
                </Label>
                <Input
                  id="routingNumber"
                  name="routingNumber"
                  defaultValue={user.bankDetails?.routingNumber}
                  placeholder="000000000"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {user.creditCard?.lastFour && (
              <div className="p-4 border rounded-lg bg-primary/5 border-primary/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-14 bg-card border rounded flex items-center justify-center shadow-sm">
                    <span className="font-bold text-primary text-xs">
                      {user.creditCard.provider || "CARD"}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      •••• •••• •••• {user.creditCard.lastFour}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Saved payment method
                    </p>
                  </div>
                </div>
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
            )}

            <div className="grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  name="cardNumber"
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input
                    id="expiry"
                    name="expiry"
                    placeholder="MM/YY"
                    maxLength={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvc">CVC</Label>
                  <Input id="cvc" name="cvc" placeholder="123" maxLength={4} />
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
