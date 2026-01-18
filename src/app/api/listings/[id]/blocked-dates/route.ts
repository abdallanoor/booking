import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import BlockedDate from "@/models/BlockedDate";
import Listing from "@/models/Listing";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/auth-middleware";
import { checkAvailability } from "@/lib/availability";

// GET /api/listings/[id]/blocked-dates - Get all blocked dates for a listing
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();
    const { id } = await params;

    const blockedDates = await BlockedDate.find({ listing: id })
      .sort({ startDate: 1 })
      .lean();

    return successResponse({ blockedDates });
  } catch (error) {
    console.error("Get blocked dates error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch blocked dates";
    return errorResponse(message, 500);
  }
}

// POST /api/listings/[id]/blocked-dates - Create a new blocked date range
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(req);
    await dbConnect();
    const { id } = await params;

    // Verify listing exists and user is the host
    const listing = await Listing.findById(id);
    if (!listing) {
      return errorResponse("Listing not found", 404);
    }

    if (
      listing.host.toString() !== user._id.toString() &&
      user.role !== "Admin"
    ) {
      return errorResponse("Forbidden: Only the host can block dates", 403);
    }

    const body = await req.json();
    const { startDate, endDate, reason } = body;

    if (!startDate || !endDate) {
      return errorResponse("Start date and end date are required", 400);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return errorResponse("End date must be on or after start date", 400);
    }

    // Check for overlapping blocked dates OR bookings (using centralized logic)
    // Host shouldn't be able to block dates if they are already booked
    const { isAvailable, error } = await checkAvailability(id, start, end);

    if (!isAvailable) {
      return errorResponse(
        error ||
          "This date range overlaps with an existing booking or blocked period",
        400,
      );
    }

    const blockedDate = await BlockedDate.create({
      listing: id,
      startDate: start,
      endDate: end,
      reason: reason || undefined,
      createdBy: user._id,
    });

    return successResponse({ blockedDate }, "Dates blocked successfully", 201);
  } catch (error) {
    console.error("Create blocked date error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to block dates";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return errorResponse(message, status);
  }
}
