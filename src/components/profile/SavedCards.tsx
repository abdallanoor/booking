"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2, CreditCard, Loader2 } from "lucide-react";
import { User } from "@/types";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SavedCardsProps {
  user: User;
  refreshUser: () => Promise<void>;
}

function CardIcon({ brand }: { brand?: string }) {
  const normalizedBrand = brand?.toLowerCase().trim();

  if (normalizedBrand === "visa") {
    return (
      <div className="h-10 w-14 flex items-center justify-center">
        <Image
          src="/visa.svg"
          alt="Visa"
          width={40}
          height={25}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  if (normalizedBrand === "mastercard") {
    return (
      <div className="h-10 w-14 flex items-center justify-center">
        <Image
          src="/mastercard.svg"
          alt="Mastercard"
          width={40}
          height={25}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <CreditCard className="size-5" />

      <span className="text-[10px] uppercase text-muted-foreground font-medium">
        {brand}
      </span>
    </div>
  );
}

export function SavedCards({ user, refreshUser }: SavedCardsProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);

  const handleDelete = async (token: string) => {
    setDeletingId(token);

    try {
      const res = await fetch("/api/user/cards", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) throw new Error("Failed to delete card");

      toast.success("Card removed successfully");
      await refreshUser();
    } catch (error) {
      console.error(error);
      toast.error("Failed to remove card");
    } finally {
      setDeletingId(null);
      setCardToDelete(null);
    }
  };

  const hasCards = user.savedCards && user.savedCards.length > 0;

  return (
    <>
      <div className="p-6 md:p-10 border-t border-border">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Saved Cards
            </h3>
            <p className="text-sm text-muted-foreground">
              Manage your saved payment methods for faster checkout.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {!hasCards ? (
            <div className="text-center py-12 px-4 border-2 border-dashed rounded-2xl bg-muted/30">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <div className="p-4 bg-muted rounded-full">
                  <CreditCard className="h-8 w-8 opacity-80" />
                </div>
                <div className="max-w-md">
                  <p className="font-medium text-foreground">
                    No saved cards found
                  </p>
                  <p className="text-sm mt-2 text-muted-foreground">
                    To save a card, please make a payment and check the "Save
                    card for future use" option during checkout.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {user.savedCards?.map((card) => (
                <div
                  key={card.token}
                  className="group flex items-center justify-between p-4 border rounded-2xl bg-card hover:bg-muted/30 transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    <CardIcon brand={card.brand} />
                    <div>
                      <div className="font-medium flex items-center gap-2 text-foreground">
                        <span className="tracking-widest">•••• •••• ••••</span>
                        <span>{card.last4}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Added on{" "}
                        {new Date(card.createdAt || "").toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "text-muted-foreground opacity-50 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all",
                      deletingId === card.token &&
                        "text-destructive opacity-100 bg-destructive/10",
                    )}
                    onClick={() => setCardToDelete(card.token)}
                    disabled={deletingId === card.token}
                  >
                    {deletingId === card.token ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AlertDialog
        open={!!cardToDelete}
        onOpenChange={(open) => !open && setCardToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this card?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove this
              payment method from your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (cardToDelete) handleDelete(cardToDelete);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!!deletingId}
            >
              {deletingId ? <Loader2 className="animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
