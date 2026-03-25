import { apiGet } from "@/lib/api";
import type { Review } from "@/types";

/**
 * Server-only service for reviews
 * Uses apiGet which handles server-side cookies and full URLs
 */
export const reviewsServerService = {
  /**
   * Get reviews for a listing (Server-side)
   */
  getReviews: async (listingId: string, locale?: string): Promise<Review[]> => {
    const headers: Record<string, string> = {};
    if (locale) headers["accept-language"] = locale;

    const response = await apiGet<{ data: { reviews: Review[] } }>(
      `/reviews?listingId=${listingId}`,
      { headers }
    );

    return response.data.reviews;
  },
};

// Also export as standalone function for convenience
export async function getReviews(listingId: string, locale?: string): Promise<Review[]> {
  return reviewsServerService.getReviews(listingId, locale);
}
