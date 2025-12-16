import { Suspense } from "react";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { SearchBar } from "@/components/search/SearchBar";
import { PropertiesGrid } from "@/components/property/PropertiesGrid";
import { searchProperties } from "@/services/search.service";
import { getWishlist } from "@/services/wishlist.service";
import { Card, CardContent } from "@/components/ui/card";

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

  const properties = await searchProperties(filters);

  let wishlistIds = new Set<string>();
  try {
    const wishlist = await getWishlist();
    const validWishlist = wishlist.filter((item) => item.property !== null);
    wishlistIds = new Set(validWishlist.map((item) => item.property._id));
  } catch (error) {
    console.log(
      "Wishlist fetch skipped:",
      error instanceof Error ? error.message : "Not authenticated"
    );
  }

  return (
    <ClientLayout>
      <main className="container py-8">
        <div className="space-y-8">
          {/* Search Bar */}
          <Suspense
            fallback={
              <div className="w-full h-16 bg-muted/20 rounded-full animate-pulse max-w-5xl mx-auto" />
            }
          >
            <SearchBar />
          </Suspense>

          {/* Results */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">
              {properties.length} properties found
            </h2>

            {properties.length === 0 ? (
              <Card>
                <CardContent className="text-center">
                  <p className="text-muted-foreground">
                    No properties found. Try adjusting your search filters.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <PropertiesGrid
                properties={properties}
                wishlistIds={wishlistIds}
              />
            )}
          </div>
        </div>
      </main>
    </ClientLayout>
  );
}
