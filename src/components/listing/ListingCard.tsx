"use client";

import { useState, useEffect, useTransition } from "react";
import { Link } from "@/navigation";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { addToWishlistAction, removeFromWishlistAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import type { Listing } from "@/types";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface ListingCardProps {
  listing: Listing;
  isInWishlist?: boolean;
}

export function ListingCard({
  listing,
  isInWishlist = false,
}: ListingCardProps) {
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [inWishlist, setInWishlist] = useState(isInWishlist);
  const t = useTranslations("listing_components");

  useEffect(() => {
    setInWishlist(isInWishlist);
  }, [isInWishlist]);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error(t("login_to_save"));
      return;
    }

    const newState = !inWishlist;
    setInWishlist(newState);

    startTransition(async () => {
      try {
        if (newState) {
          await addToWishlistAction(listing._id);
          toast.success(t("added_wishlist"));
        } else {
          await removeFromWishlistAction(listing._id);
          toast.success(t("removed_wishlist"));
        }
      } catch (error) {
        setInWishlist(!newState);
        toast.error(error instanceof Error ? error.message : t("failed"));
      }
    });
  };

  return (
    <Card className="group relative overflow-hidden hover:shadow-lg transition-shadow pt-0">
      <div className="relative aspect-4/3">
        <Image
          src={listing.images[0]}
          alt={listing.title}
          fill
          className="object-cover"
        />
      </div>

      <CardContent>
        <div className="space-y-2">
          <h3 className="font-semibold truncate">{listing.title}</h3>
          <p className="text-sm text-muted-foreground">
            {listing.location.city}, {listing.location.country}
          </p>
          <div className="flex items-baseline gap-1">
            <span className="font-bold gap-1 mt-1">
              {formatCurrency(listing.pricePerNight)}
            </span>
            <span className="text-sm text-muted-foreground">
              {t("per_night")}
            </span>
          </div>
          <div className="flex gap-2 text-xs text-muted-foreground">
            <span>{t("guests", { count: listing.maxGuests })}</span>
            <span>•</span>
            <span>{t("bedrooms", { count: listing.bedrooms })}</span>
            <span>•</span>
            <span>{t("beds", { count: listing.beds })}</span>
          </div>
        </div>
      </CardContent>

      <Link href={`/listings/${listing._id}`} className="absolute inset-0 z-10">
        <span className="sr-only">
          {t("view_listing", { title: listing.title })}
        </span>
      </Link>

      <Button
        variant="secondary"
        size="icon"
        className="absolute top-2 right-2 z-20 rounded-full"
        onClick={toggleWishlist}
        disabled={isPending}
      >
        <Heart
          className={`h-5 w-5 transition-colors ${
            inWishlist ? "fill-red-500 text-red-500" : "text-foreground"
          }`}
        />
      </Button>
    </Card>
  );
}
