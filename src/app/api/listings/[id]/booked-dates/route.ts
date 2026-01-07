import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Booking from "@/models/Booking";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    // Fetch only confirmed bookings for this listing
    // pending_payment bookings don't block dates until payment is successful
    const bookings = await Booking.find({
      listing: id,
      status: "confirmed",
    }).select("checkIn checkOut");

    // Format the booked dates
    const bookedDates = bookings.map((booking) => ({
      from: booking.checkIn,
      to: booking.checkOut,
    }));

    return successResponse({ bookedDates });
  } catch (error) {
    console.error("Get booked dates error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch booked dates";
    return errorResponse(message, 500);
  }
}
