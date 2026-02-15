import { apiGet, apiPut } from "@/lib/api";
import type { CalendarDate, BulkUpdateCalendarDatesInput } from "@/types";

// Get calendar dates for a listing within a date range
export async function getCalendarDates(
  listingId: string,
  from?: string,
  to?: string
): Promise<CalendarDate[]> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await apiGet<{ data: { calendarDates: CalendarDate[] } }>(
    `/listings/${listingId}/calendar-dates${query}`
  );
  return response.data.calendarDates;
}

// Bulk update calendar dates
export async function updateCalendarDates(
  listingId: string,
  data: BulkUpdateCalendarDatesInput
): Promise<CalendarDate[]> {
  const response = await apiPut<{ data: { calendarDates: CalendarDate[] } }>(
    `/listings/${listingId}/calendar-dates`,
    data
  );
  return response.data.calendarDates;
}
