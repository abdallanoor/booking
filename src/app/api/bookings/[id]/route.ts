import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Listing from "@/models/Listing";
import { requireAuth } from "@/lib/auth/auth-middleware";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    await dbConnect();
    const { id } = await params;

    const booking = await Booking.findById(id)
      .populate("listing")
      .populate("guest", "name email");

    if (!booking) {
      return errorResponse("Booking not found", 404);
    }

    // Check if user is the guest or the listing host
    const listing = await Listing.findById(booking.listing);
    if (
      booking.guest._id.toString() !== user._id.toString() &&
      listing?.host.toString() !== user._id.toString() &&
      user.role !== "Admin"
    ) {
      return errorResponse("Forbidden", 403);
    }

    return successResponse({ booking });
  } catch (error) {
    console.error("Get booking error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to get booking";
    return errorResponse(message, 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    await dbConnect();
    const { id } = await params;

    const booking = await Booking.findById(id);

    if (!booking) {
      return errorResponse("Booking not found", 404);
    }

    // Only guest can cancel
    if (
      booking.guest.toString() !== user._id.toString() &&
      user.role !== "Admin"
    ) {
      return errorResponse("Forbidden", 403);
    }

    const body = await req.json();

    if (body.status === "cancelled") {
      booking.status = "cancelled";
      await booking.save();
      return successResponse({ booking }, "Booking cancelled successfully");
    }

    return errorResponse("Invalid status", 400);
  } catch (error) {
    console.error("Update booking error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update booking";
    return errorResponse(message, 500);
  }
}
