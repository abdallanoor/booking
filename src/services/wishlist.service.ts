import { apiGet } from "@/lib/api";
import type { WishlistItem } from "@/types";

export async function getWishlist(): Promise<WishlistItem[]> {
  const response = await apiGet<{ data: { wishlist: WishlistItem[] } }>(
    "/wishlist",
    {
      revalidate: 0, // No cache - user-specific data
      tags: ["wishlist"],
    }
  );

  return response.data.wishlist;
}
