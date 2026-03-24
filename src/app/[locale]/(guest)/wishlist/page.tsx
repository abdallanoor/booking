import { getWishlist } from "@/services/wishlist.service";
import { ListingCard } from "@/components/listing/ListingCard";
import { Card, CardContent } from "@/components/ui/card";

import { getTranslations, getLocale } from "next-intl/server";

export default async function WishlistPage() {
  const t = await getTranslations("wishlist");
  const locale = await getLocale();
  const wishlist = await getWishlist(locale);

  // Filter out items with deleted listings
  const validWishlist = wishlist.filter((item) => item.listing !== null);

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t("title")}</h1>

      {validWishlist.length === 0 ? (
        <Card>
          <CardContent className="text-center py-10">
            <p className="text-muted-foreground">{t("empty")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {validWishlist.map((item) => (
            <ListingCard
              key={item._id}
              listing={item.listing}
              isInWishlist={true}
            />
          ))}
        </div>
      )}
    </main>
  );
}
