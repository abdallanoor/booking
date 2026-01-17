"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, CreditCard, Trash2, ShieldCheck } from "lucide-react";
import type { User } from "@/types";

type ClientUser = Omit<User, "_id"> & { id?: string; _id?: string };

interface SavedCardsProps {
  user: ClientUser;
  refreshUser: () => Promise<void>;
}

interface SavedCardInfo {
  lastFour: string;
  maskedPan: string;
  provider: string;
  cardSubtype: string;
  hasSavedCard: boolean;
}

export function SavedCards({ refreshUser }: SavedCardsProps) {
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [card, setCard] = useState<SavedCardInfo | null>(null);

  useEffect(() => {
    fetchSavedCard();
  }, []);

  const fetchSavedCard = async () => {
    try {
      const res = await fetch("/api/payments/saved-cards");
      if (res.ok) {
        const data = await res.json();
        setCard(data.data?.card || null);
      }
    } catch (error) {
      console.error("Failed to fetch saved card:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to remove your saved card?")) return;

    setDeleting(true);
    try {
      const res = await fetch("/api/payments/saved-cards", {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Saved card removed");
        setCard(null);
        await refreshUser();
      } else {
        toast.error("Failed to remove saved card");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setDeleting(false);
    }
  };

  const getCardBrandIcon = (subtype: string) => {
    const brand = subtype?.toLowerCase() || "";
    if (brand.includes("visa")) return "VISA";
    if (brand.includes("master")) return "MC";
    if (brand.includes("amex")) return "AMEX";
    return "CARD";
  };

  return (
    <div className="p-6 md:p-10 border-t border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Saved Cards</h3>
          <p className="text-sm text-muted-foreground">
            Manage your saved payment methods for faster checkout.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : card?.hasSavedCard ? (
        <div className="p-4 border rounded-xl bg-linear-to-r from-primary/5 to-primary/10 border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-16 bg-card border rounded-lg flex items-center justify-center shadow-sm">
                <span className="font-bold text-primary text-xs">
                  {getCardBrandIcon(card.cardSubtype)}
                </span>
              </div>
              <div>
                <p className="font-medium text-foreground flex items-center gap-2">
                  •••• •••• •••• {card.lastFour}
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                </p>
                <p className="text-xs text-muted-foreground">
                  {card.cardSubtype || "Card"} • Saved via Paymob
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={deleting}
              className="text-muted-foreground hover:text-destructive"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-6 border rounded-xl bg-muted/30 text-center">
          <CreditCard className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">
            No saved cards
          </p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Your card will be saved automatically when you complete a payment
            and choose to save it for future bookings.
          </p>
        </div>
      )}
    </div>
  );
}
