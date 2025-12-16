"use client";

import { useState, useEffect, useTransition } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { addToWishlistAction, removeFromWishlistAction } from "@/actions";
import { toast } from "sonner";

interface SaveButtonProps {
  propertyId: string;
  initialIsInWishlist?: boolean;
}

export function SaveButton({
  propertyId,
  initialIsInWishlist = false,
}: SaveButtonProps) {
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [inWishlist, setInWishlist] = useState(initialIsInWishlist);

  useEffect(() => {
    setInWishlist(initialIsInWishlist);
  }, [initialIsInWishlist]);

  const toggleWishlist = () => {
    if (!user) {
      toast.error("Please login to save this property");
      return;
    }

    const newState = !inWishlist;
    setInWishlist(newState);

    startTransition(async () => {
      try {
        if (newState) {
          await addToWishlistAction(propertyId);
          toast.success("Added to wishlist");
        } else {
          await removeFromWishlistAction(propertyId);
          toast.success("Removed from wishlist");
        }
      } catch (error) {
        setInWishlist(!newState);
        toast.error(error instanceof Error ? error.message : "Failed");
      }
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="flex gap-2"
      onClick={toggleWishlist}
      disabled={isPending}
    >
      <Heart
        className={`w-4 h-4 transition-colors ${
          inWishlist ? "fill-red-500 text-red-500" : ""
        }`}
      />
      <span>{inWishlist ? "Saved" : "Save"}</span>
    </Button>
  );
}
