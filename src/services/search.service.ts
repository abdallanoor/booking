import { apiGet } from "@/lib/api";
import type { Listing, SearchFilters } from "@/types";

// Search listings with minimal caching
export async function searchListings(
  filters: SearchFilters,
  locale?: string
): Promise<Listing[]> {
  const params = new URLSearchParams();
  if (filters.location) params.append("location", filters.location);
  if (filters.checkIn) params.append("checkIn", filters.checkIn);
  if (filters.checkOut) params.append("checkOut", filters.checkOut);
  if (filters.guests) params.append("guests", filters.guests.toString());

  const headers: Record<string, string> = {};
  if (locale) headers["accept-language"] = locale;

  const response = await apiGet<{
    data: { listings: Listing[]; count: number };
  }>(`/search?${params.toString()}`, { headers });

  return response.data.listings;
}
