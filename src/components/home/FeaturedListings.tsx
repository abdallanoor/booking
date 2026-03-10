import { cookies } from "next/headers";
import { ListingsGrid } from "@/components/listing/ListingsGrid";
import { getListings } from "@/services/listings.service";
import { getWishlist } from "@/services/wishlist.service";

export default async function FeaturedListings() {
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
        error instanceof Error ? error.message : "Not authenticated",
      );
    }
  }
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Featured Listings</h2>
      <ListingsGrid listings={listings} wishlistIds={wishlistIds} />
    </div>
  );
}
