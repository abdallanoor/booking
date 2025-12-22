import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Booking from "@/models/Booking";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const { listingId, checkIn, checkOut } = body;

    if (!listingId || !checkIn || !checkOut) {
      return errorResponse("Missing required fields", 400);
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Check for overlapping bookings
    const overlappingBooking = await Booking.findOne({
      listing: listingId,
      status: { $ne: "cancelled" },
      $or: [
        {
          checkIn: { $lte: checkOutDate },
          checkOut: { $gte: checkInDate },
        },
      ],
    });

    const isAvailable = !overlappingBooking;

    return successResponse({
      available: isAvailable,
      message: isAvailable
        ? "Dates are available"
        : "Listing is already booked for these dates",
    });
  } catch (error) {
    console.error("Check availability error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to check availability";
    return errorResponse(message, 500);
  }
}
