"use client";

import { useState, useEffect, useTransition } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { addToWishlistAction, removeFromWishlistAction } from "@/actions";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface SaveButtonProps {
  listingId: string;
  initialIsInWishlist?: boolean;
}

export function SaveButton({
  listingId,
  initialIsInWishlist = false,
}: SaveButtonProps) {
  // Smart hook that handles SSR gracefully
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [inWishlist, setInWishlist] = useState(initialIsInWishlist);
  const t = useTranslations("listing_components");

  useEffect(() => {
    setInWishlist(initialIsInWishlist);
  }, [initialIsInWishlist]);

  const toggleWishlist = () => {
    if (!user) {
      toast.error(t("login_to_save"));
      return;
    }

    const newState = !inWishlist;
    setInWishlist(newState);

    startTransition(async () => {
      try {
        if (newState) {
          await addToWishlistAction(listingId);
          toast.success(t("added_wishlist"));
        } else {
          await removeFromWishlistAction(listingId);
          toast.success(t("removed_wishlist"));
        }
      } catch (error) {
        setInWishlist(!newState);
        toast.error(error instanceof Error ? error.message : t("failed"));
      }
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="flex gap-2 max-sm:rounded-full max-sm:bg-accent max-sm:size-9"
      onClick={toggleWishlist}
      disabled={isPending}
    >
      <Heart
        className={`w-4 h-4 transition-colors ${
          inWishlist ? "fill-red-500 text-red-500" : ""
        }`}
      />
      <span className="max-sm:hidden">
        {inWishlist ? t("saved") : t("save")}
      </span>
    </Button>
  );
}
