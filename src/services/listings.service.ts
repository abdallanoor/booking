import { apiGet } from "@/lib/api";
import type { Listing, ListingFilters } from "@/types";

// Re-export types for backward compatibility
export type { Listing, ListingFilters };

// Get all listings with caching
export async function getListings(
  filters?: ListingFilters
): Promise<Listing[]> {
  const params = new URLSearchParams();
  if (filters?.city) params.append("city", filters.city);
  if (filters?.country) params.append("country", filters.country);
  if (filters?.minPrice) params.append("minPrice", filters.minPrice.toString());
  if (filters?.maxPrice) params.append("maxPrice", filters.maxPrice.toString());
  if (filters?.guests) params.append("guests", filters.guests.toString());
  if (filters?.hostId) params.append("hostId", filters.hostId);

  const query = params.toString();
  const response = await apiGet<{ data: { listings: Listing[] } }>(
    `/listings${query ? `?${query}` : ""}`,
    {
      revalidate: 0, // No cache
      tags: ["listings"],
    }
  );

  return response.data.listings;
}

// Get single listing with caching
export async function getListing(id: string): Promise<Listing> {
  const response = await apiGet<{ data: { listing: Listing } }>(
    `/listings/${id}`,
    {
      revalidate: 0, // No cache
      tags: [`listing-${id}`, "listings"],
    }
  );

  return response.data.listing;
}

// Get booked dates for a listing
export async function getListingBookedDates(
  id: string
): Promise<{ from: string; to: string }[]> {
  const response = await apiGet<{
    data: { bookedDates: { from: string; to: string }[] };
  }>(`/listings/${id}/booked-dates`, {
    revalidate: 0, // No cache, always fresh
    tags: [`listing-${id}-bookings`, "bookings"],
  });

  return response.data.bookedDates;
}
