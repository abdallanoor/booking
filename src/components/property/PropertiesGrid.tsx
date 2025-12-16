"use client";

import { PropertyCard } from "./PropertyCard";
import type { Property } from "@/types";

interface PropertiesGridProps {
  properties: Property[];
  wishlistIds?: Set<string>;
}

export function PropertiesGrid({
  properties,
  wishlistIds = new Set(),
}: PropertiesGridProps) {
  if (properties.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No properties available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {properties.map((property) => (
        <PropertyCard
          key={property._id}
          property={property}
          isInWishlist={wishlistIds.has(property._id)}
        />
      ))}
    </div>
  );
}
