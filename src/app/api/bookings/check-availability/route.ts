import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import { successResponse, errorResponse } from "@/lib/api-response";
import { checkAvailability } from "@/lib/availability";

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

    // Use centralized availability check
    const { isAvailable, error } = await checkAvailability(
      listingId,
      checkInDate,
      checkOutDate,
    );

    if (!isAvailable) {
      return successResponse({
        available: false,
        message: error || "Dates are not available",
      });
    }

    return successResponse({
      available: true,
      message: "Dates are available",
    });
  } catch (error) {
    console.error("Check availability error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to check availability";
    return errorResponse(message, 500);
  }
}
