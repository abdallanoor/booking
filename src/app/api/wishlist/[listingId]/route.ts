import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Wishlist from "@/models/Wishlist";
import { requireAuth } from "@/lib/auth/auth-middleware";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const user = await requireAuth(req);
    await dbConnect();
    const { listingId } = await params;

    const result = await Wishlist.findOneAndDelete({
      user: user._id,
      listing: listingId,
    });

    if (!result) {
      return errorResponse("Wishlist item not found", 404);
    }

    return successResponse(null, "Removed from wishlist");
  } catch (error) {
    console.error("Remove from wishlist error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to remove from wishlist";
    return errorResponse(message, 500);
  }
}
