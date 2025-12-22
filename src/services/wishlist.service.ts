import { apiGet } from "@/lib/api";
import type { Listing } from "./listings.service";

export interface WishlistItem {
  _id: string;
  user: string;
  listing: Listing;
  createdAt: string;
}

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
