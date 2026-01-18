import Booking from "@/models/Booking";
import BlockedDate from "@/models/BlockedDate";

export interface AvailabilityResult {
  isAvailable: boolean;
  error?: string;
}

export async function checkAvailability(
  listingId: string,
  checkIn: Date,
  checkOut: Date,
  excludeBookingId?: string,
): Promise<AvailabilityResult> {
  const [overlappingBooking, overlappingBlocked] = await Promise.all([
    Booking.findOne({
      listing: listingId,
      status: "confirmed",
      _id: { $ne: excludeBookingId },
      $or: [{ checkIn: { $lt: checkOut }, checkOut: { $gt: checkIn } }],
    }),
    BlockedDate.findOne({
      listing: listingId,
      $or: [{ startDate: { $lt: checkOut }, endDate: { $gt: checkIn } }],
    }),
  ]);

  if (overlappingBooking || overlappingBlocked) {
    return {
      isAvailable: false,
      error: "Sorry, these dates are no longer available.",
    };
  }

  return { isAvailable: true };
}
