import { cookies } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { ListingsGrid } from "@/components/listing/ListingsGrid";
import { getListings } from "@/services/listings.service";
import { getWishlist } from "@/services/wishlist.service";

export default async function FeaturedListings() {
  const locale = await getLocale();
  const t = await getTranslations("home");
  const listings = await getListings(undefined, locale);

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
    <div className="text-start">
      <h2 className="text-2xl font-semibold mb-4">{t("featured_listings")}</h2>
      <ListingsGrid listings={listings} wishlistIds={wishlistIds} />
    </div>
  );
}
