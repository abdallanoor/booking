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
// Get host bookings with pagination
export async function getHostBookings(
  page: number = 1,
  limit: number = 10
): Promise<{ bookings: Booking[]; pagination: any }> {
  const response = await apiGet<{
    data: { bookings: Booking[]; pagination: any };
  }>(`/bookings?view=host&page=${page}&limit=${limit}`);

  return {
    bookings: response.data.bookings,
    pagination: response.data.pagination,
  };
}

export async function getAdminBookings(
  page: number = 1,
  limit: number = 10,
  status?: string
): Promise<{ bookings: Booking[]; pagination: any }> {
  const params = new URLSearchParams();
  params.append("view", "admin");
  params.append("page", page.toString());
  params.append("limit", limit.toString());
  if (status) params.append("status", status);

  const response = await apiGet<{
    data: { bookings: Booking[]; pagination: any };
  }>(`/bookings?${params.toString()}`);

  return {
    bookings: response.data.bookings || [],
    pagination: response.data.pagination || { page: 1, limit: 10, total: 0, pages: 1 }
  };
}
