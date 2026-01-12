import { Suspense } from "react";
import { cookies } from "next/headers";
import { ListingsGrid } from "@/components/listing/ListingsGrid";
import { DynamicSearchBar } from "@/components/search/DynamicSearchBar";
import { getListings } from "@/services/listings.service";
import { getWishlist } from "@/services/wishlist.service";

import { SearchBarSkeleton } from "@/components/search/SearchBarSkeleton";



export default async function Home() {
  const listings = await getListings();

  let wishlistIds = new Set<string>();
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token");

  if (token) {
    try {
      const wishlist = await getWishlist();
      // Filter out items with null listings
      const validWishlist = wishlist.filter((item) => item.listing !== null);
      wishlistIds = new Set(validWishlist.map((item) => item.listing._id));
    } catch (error) {
      console.log(
        "Wishlist fetch skipped:",
        error instanceof Error ? error.message : "Not authenticated"
      );
    }
  }

  return (
    <main className="container py-8">
      <div className="space-y-8">
        {/* Hero Section with Search */}
        <div className="space-y-6">
          {/* <h1 className="text-4xl font-bold">Find Your Perfect Stay</h1>
          <p className="text-lg text-muted-foreground">
            Book unique homes and experiences around the world
          </p> */}

          {/* Search Bar */}
          <Suspense fallback={<SearchBarSkeleton />}>
            <DynamicSearchBar />
          </Suspense>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Featured Listings</h2>
          <ListingsGrid listings={listings} wishlistIds={wishlistIds} />
        </div>
      </div>
    </main>
  );
}
