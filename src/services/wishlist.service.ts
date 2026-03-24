import { apiGet } from "@/lib/api";
import type { WishlistItem } from "@/types";

export async function getWishlist(locale?: string): Promise<WishlistItem[]> {
  const headers: Record<string, string> = {};
  if (locale) headers["accept-language"] = locale;
  const response = await apiGet<{ data: { wishlist: WishlistItem[] } }>(
    "/wishlist",
    { headers }
  );

  return response.data.wishlist;
}
