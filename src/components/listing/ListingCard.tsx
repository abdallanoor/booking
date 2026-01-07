"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";
import { addToWishlistAction, removeFromWishlistAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import type { Listing } from "@/types";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

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

  useEffect(() => {
    setInWishlist(isInWishlist);
  }, [isInWishlist]);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to save this listing");
      return;
    }

    const newState = !inWishlist;
    setInWishlist(newState);

    startTransition(async () => {
      try {
        if (newState) {
          await addToWishlistAction(listing._id);
          toast.success("Added to wishlist");
        } else {
          await removeFromWishlistAction(listing._id);
          toast.success("Removed from wishlist");
        }
      } catch (error) {
        setInWishlist(!newState);
        toast.error(error instanceof Error ? error.message : "Failed");
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
        <Badge className="absolute bottom-2 left-2">
          {listing.privacyType.replace("_", " ")}
        </Badge>
      </div>

      <CardContent>
        <div className="space-y-2">
          <h3 className="font-semibold truncate">{listing.title}</h3>
          <p className="text-sm text-muted-foreground">
            {listing.location.city}, {listing.location.country}
          </p>
          <div className="flex items-baseline gap-1">
            <span className="font-bold">
              {formatCurrency(listing.pricePerNight)}
            </span>
            <span className="text-sm text-muted-foreground">/ night</span>
          </div>
          <div className="flex gap-2 text-xs text-muted-foreground">
            <span>{listing.maxGuests} guests</span>
            <span>•</span>
            <span>{listing.bedrooms} bedrooms</span>
            <span>•</span>
            <span>{listing.beds} beds</span>
          </div>
        </div>
      </CardContent>

      <Link href={`/listings/${listing._id}`} className="absolute inset-0 z-10">
        <span className="sr-only">View {listing.title}</span>
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
