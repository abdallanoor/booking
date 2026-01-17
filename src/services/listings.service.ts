import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "@/lib/api";
import type { Listing, ListingFilters } from "@/types";
import type { ListingInput } from "@/lib/validations/listing";

// Re-export types for backward compatibility
export type { Listing, ListingFilters };

// Get all listings
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
    `/listings${query ? `?${query}` : ""}`
  );

  return response.data.listings;
}

// Get single listing
export async function getListing(id: string): Promise<Listing> {
  const response = await apiGet<{ data: { listing: Listing } }>(
    `/listings/${id}`
  );

  return response.data.listing;
}

// Get booked dates for a listing
export async function getListingBookedDates(
  id: string
): Promise<{ from: string; to: string }[]> {
  const response = await apiGet<{
    data: { bookedDates: { from: string; to: string }[] };
  }>(`/listings/${id}/booked-dates`);

  return response.data.bookedDates;
}

// Get all listings for admin
export async function getAllListings(): Promise<Listing[]> {
  const response = await apiGet<{ data: { listings: Listing[] } }>(
    "/listings?dashboard=true"
  );
  return response.data.listings;
}

// Get listings for current host
export async function getHostListings(): Promise<Listing[]> {
  const response = await apiGet<{ data: { listings: Listing[] } }>(
    "/listings?dashboard=true"
  );
  return response.data.listings;
}

// Create a new listing
export async function createListing(data: ListingInput): Promise<Listing> {
  const response = await apiPost<{ data: { listing: Listing } }>(
    "/listings",
    data
  );
  return response.data.listing;
}

// Update an existing listing
export async function updateListing(
  id: string,
  data: Partial<ListingInput>
): Promise<Listing> {
  const response = await apiPut<{ data: { listing: Listing } }>(
    `/listings/${id}`,
    data
  );
  return response.data.listing;
}

// Update listing status (Admin)
export async function updateListingStatus(
  id: string,
  status: "approved" | "rejected"
) {
  return await apiPatch(`/listings/${id}`, { status });
}

// Delete a listing
export async function deleteListing(id: string) {
  return await apiDelete(`/listings/${id}`);
}
