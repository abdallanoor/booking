import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/auth-middleware";

/**
 * GET /api/payments/saved-cards
 * Returns the user's saved card info (masked)
 */
export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    await dbConnect();

    const user = await User.findById(authUser._id);

    if (!user?.creditCard?.token) {
      return successResponse({ card: null }, "No saved card found");
    }

    // Return masked card info (never expose the full token to client)
    return successResponse({
      card: {
        lastFour: user.creditCard.lastFour || "",
        maskedPan: user.creditCard.maskedPan || "",
        provider: user.creditCard.provider || "card",
        cardSubtype: user.creditCard.cardSubtype || "",
        hasSavedCard: true,
      },
    });
  } catch (error) {
    console.error("[Saved Cards GET] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to get saved cards";
    return errorResponse(message, 500);
  }
}

/**
 * DELETE /api/payments/saved-cards
 * Removes the user's saved card
 */
export async function DELETE(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    await dbConnect();

    await User.findByIdAndUpdate(authUser._id, {
      $unset: { creditCard: 1 },
    });

    return successResponse(
      { deleted: true },
      "Saved card removed successfully"
    );
  } catch (error) {
    console.error("[Saved Cards DELETE] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete saved card";
    return errorResponse(message, 500);
  }
}
