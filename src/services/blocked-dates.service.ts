import { apiGet, apiPost, apiDelete } from "@/lib/api";
import type { BlockedDate, CreateBlockedDateInput } from "@/types";

// Get all blocked dates for a listing
export async function getBlockedDates(
  listingId: string,
): Promise<BlockedDate[]> {
  const response = await apiGet<{ data: { blockedDates: BlockedDate[] } }>(
    `/listings/${listingId}/blocked-dates`,
  );
  return response.data.blockedDates;
}

// Create a new blocked date range
export async function createBlockedDate(
  listingId: string,
  data: CreateBlockedDateInput,
): Promise<BlockedDate> {
  const response = await apiPost<{ data: { blockedDate: BlockedDate } }>(
    `/listings/${listingId}/blocked-dates`,
    data,
  );
  return response.data.blockedDate;
}

// Delete a blocked date range
export async function deleteBlockedDate(
  listingId: string,
  blockedId: string,
): Promise<void> {
  await apiDelete(`/listings/${listingId}/blocked-dates/${blockedId}`);
}
