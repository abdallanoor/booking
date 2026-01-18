import { apiGet } from "@/lib/api";
import type { WishlistItem } from "@/types";

export async function getWishlist(): Promise<WishlistItem[]> {
  const response = await apiGet<{ data: { wishlist: WishlistItem[] } }>(
    "/wishlist"
  );

  return response.data.wishlist;
}
