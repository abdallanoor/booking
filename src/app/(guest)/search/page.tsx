import { Suspense } from "react";
import { cookies } from "next/headers";
import { DynamicSearchBar } from "@/components/search/DynamicSearchBar";
import { ListingsGrid } from "@/components/listing/ListingsGrid";
import { searchListings } from "@/services/search.service";
import { getWishlist } from "@/services/wishlist.service";
import { Card, CardContent } from "@/components/ui/card";
import { SearchBarSkeleton } from "@/components/search/SearchBarSkeleton";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;

  const filters = {
    location: params.location,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    guests: params.guests ? parseInt(params.guests) : undefined,
  };

  const listings = await searchListings(filters);

  let wishlistIds = new Set<string>();
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token");

  if (token) {
    try {
      const wishlist = await getWishlist();
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
        {/* Search Bar */}
        <Suspense fallback={<SearchBarSkeleton />}>
          <DynamicSearchBar />
        </Suspense>

        {/* Results */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">
            {listings.length} listings found
          </h2>

          {listings.length === 0 ? (
            <Card>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  No listings found. Try adjusting your search filters.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ListingsGrid listings={listings} wishlistIds={wishlistIds} />
          )}
        </div>
      </div>
    </main>
  );
}
