import { apiGet } from "@/lib/api";
import type { Property, PropertyFilters } from "@/types";

// Re-export types for backward compatibility
export type { Property, PropertyFilters };

// Get all properties with caching
export async function getProperties(
  filters?: PropertyFilters
): Promise<Property[]> {
  const params = new URLSearchParams();
  if (filters?.city) params.append("city", filters.city);
  if (filters?.country) params.append("country", filters.country);
  if (filters?.minPrice) params.append("minPrice", filters.minPrice.toString());
  if (filters?.maxPrice) params.append("maxPrice", filters.maxPrice.toString());
  if (filters?.guests) params.append("guests", filters.guests.toString());
  if (filters?.hostId) params.append("hostId", filters.hostId);

  const query = params.toString();
  const response = await apiGet<{ data: { properties: Property[] } }>(
    `/properties${query ? `?${query}` : ""}`,
    {
      revalidate: 60, // Cache for 60 seconds
      tags: ["properties"],
    }
  );

  return response.data.properties;
}

// Get single property with caching
export async function getProperty(id: string): Promise<Property> {
  const response = await apiGet<{ data: { property: Property } }>(
    `/properties/${id}`,
    {
      revalidate: 0, // No cache
      tags: [`property-${id}`, "properties"],
    }
  );

  return response.data.property;
}

// Get booked dates for a property
export async function getPropertyBookedDates(
  id: string
): Promise<{ from: string; to: string }[]> {
  const response = await apiGet<{
    data: { bookedDates: { from: string; to: string }[] };
  }>(`/properties/${id}/booked-dates`, {
    revalidate: 0, // No cache, always fresh
    tags: [`property-${id}-bookings`, "bookings"],
  });

  return response.data.bookedDates;
}
