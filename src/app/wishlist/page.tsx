import { ClientLayout } from "@/components/layout/ClientLayout";
import { getWishlist } from "@/services/wishlist.service";
import { PropertyCard } from "@/components/property/PropertyCard";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  let wishlist;

  try {
    wishlist = await getWishlist();
  } catch {
    // User not authenticated or error fetching
    return (
      <ClientLayout>
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">My Wishlist</h1>
          <Card>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Please login to view your wishlist
              </p>
            </CardContent>
          </Card>
        </main>
      </ClientLayout>
    );
  }

  // Filter out items with deleted properties
  const validWishlist = wishlist.filter((item) => item.property !== null);

  return (
    <ClientLayout>
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Wishlist</h1>

        {validWishlist.length === 0 ? (
          <Card>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Your wishlist is empty. Start adding properties you love!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {validWishlist.map((item) => (
              <PropertyCard
                key={item._id}
                property={item.property}
                isInWishlist={true}
              />
            ))}
          </div>
        )}
      </main>
    </ClientLayout>
  );
}
