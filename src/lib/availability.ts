import Booking from "@/models/Booking";
import CalendarDate from "@/models/CalendarDate";

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
  const [overlappingBooking, blockedCalendarDates] = await Promise.all([
    Booking.findOne({
      listing: listingId,
      status: "confirmed",
      _id: { $ne: excludeBookingId },
      $or: [{ checkIn: { $lt: checkOut }, checkOut: { $gt: checkIn } }],
    }),
    // Check for any blocked individual calendar dates in the range
    CalendarDate.findOne({
      listing: listingId,
      isBlocked: true,
      date: { $gte: checkIn, $lt: checkOut },
    }),
  ]);

  if (overlappingBooking || blockedCalendarDates) {
    return {
      isAvailable: false,
      error: "Sorry, these dates are no longer available.",
    };
  }

  return { isAvailable: true };
}

