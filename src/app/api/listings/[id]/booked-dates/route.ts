import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Booking from "@/models/Booking";
import BlockedDate from "@/models/BlockedDate";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();
    const { id } = await params;

    // Fetch confirmed bookings for this listing
    const bookings = await Booking.find({
      listing: id,
      status: "confirmed",
    }).select("checkIn checkOut");

    // Fetch blocked dates for this listing
    const blockedDates = await BlockedDate.find({
      listing: id,
    }).select("startDate endDate");

    // Format the booked dates from bookings
    const bookedFromBookings = bookings.map((booking) => ({
      from: booking.checkIn,
      to: booking.checkOut,
      type: "booking" as const,
    }));

    // Format the blocked dates
    const bookedFromBlocked = blockedDates.map((blocked) => ({
      from: blocked.startDate,
      to: blocked.endDate,
      type: "blocked" as const,
    }));

    // Merge both sources
    const bookedDates = [...bookedFromBookings, ...bookedFromBlocked];

    return successResponse({ bookedDates });
  } catch (error) {
    console.error("Get booked dates error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch booked dates";
    return errorResponse(message, 500);
  }
}
