import { apiGet } from "@/lib/api";
import type { Listing } from "./listings.service";

export interface SearchFilters {
  location?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
}

// Search listings with minimal caching
export async function searchListings(
  filters: SearchFilters
): Promise<Listing[]> {
  const params = new URLSearchParams();
  if (filters.location) params.append("location", filters.location);
  if (filters.checkIn) params.append("checkIn", filters.checkIn);
  if (filters.checkOut) params.append("checkOut", filters.checkOut);
  if (filters.guests) params.append("guests", filters.guests.toString());

  const response = await apiGet<{
    data: { listings: Listing[]; count: number };
  }>(`/search?${params.toString()}`, {
    revalidate: 30, // Short cache for search results
    tags: ["search"],
  });

  return response.data.listings;
}
