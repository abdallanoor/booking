"use client";

import { ListingCard } from "./ListingCard";
import type { Listing } from "@/types";

interface ListingsGridProps {
  listings: Listing[];
  wishlistIds?: Set<string>;
}

export function ListingsGrid({
  listings,
  wishlistIds = new Set(),
}: ListingsGridProps) {
  if (listings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No listings available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {listings.map((listing) => (
        <ListingCard
          key={listing._id}
          listing={listing}
          isInWishlist={wishlistIds.has(listing._id)}
        />
      ))}
    </div>
  );
}
