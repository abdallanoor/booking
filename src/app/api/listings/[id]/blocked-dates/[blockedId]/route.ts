import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import BlockedDate from "@/models/BlockedDate";
import Listing from "@/models/Listing";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/auth-middleware";

// DELETE /api/listings/[id]/blocked-dates/[blockedId] - Remove a blocked date range
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; blockedId: string }> },
) {
  try {
    const user = await requireAuth(req);
    await dbConnect();
    const { id, blockedId } = await params;

    // Verify listing exists and user is the host
    const listing = await Listing.findById(id);
    if (!listing) {
      return errorResponse("Listing not found", 404);
    }

    if (
      listing.host.toString() !== user._id.toString() &&
      user.role !== "Admin"
    ) {
      return errorResponse(
        "Forbidden: Only the host can manage blocked dates",
        403,
      );
    }

    const blockedDate = await BlockedDate.findOne({
      _id: blockedId,
      listing: id,
    });

    if (!blockedDate) {
      return errorResponse("Blocked date range not found", 404);
    }

    await BlockedDate.findByIdAndDelete(blockedId);

    return successResponse(null, "Dates unblocked successfully");
  } catch (error) {
    console.error("Delete blocked date error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to unblock dates";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return errorResponse(message, status);
  }
}
