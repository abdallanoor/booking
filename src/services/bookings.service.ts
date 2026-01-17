import { apiGet } from "@/lib/api";
import type { Booking } from "@/types";

// Re-export type for backward compatibility
export type { Booking };

// Get all bookings with caching
export async function getBookings(): Promise<Booking[]> {
  const response = await apiGet<{ data: { bookings: Booking[] } }>(
    "/bookings?view=guest"
  );

  return response.data.bookings;
}

// Get single booking with caching
export async function getBooking(id: string): Promise<Booking> {
  const response = await apiGet<{ data: { booking: Booking } }>(
    `/bookings/${id}`
  );

  return response.data.booking;
}
