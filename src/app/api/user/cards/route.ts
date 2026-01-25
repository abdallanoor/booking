import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/auth-middleware";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { successResponse, errorResponse } from "@/lib/api-response";

/**
 * DELETE /api/user/cards
 * Removes a saved card from the user's profile
 * Body: { token: string }
 */
export async function DELETE(req: NextRequest) {
    try {
        const user = await requireAuth(req);
        await dbConnect();

        const body = await req.json();
        const { token } = body;

        if (!token) {
            return errorResponse("Card token is required", 400);
        }

        // Use findOneAndUpdate to atomically pull the card
        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            {
                $pull: { savedCards: { token: token } },
            },
            { new: true },
        );

        if (!updatedUser) {
            return errorResponse("User not found", 404);
        }

        return successResponse(
            { savedCards: updatedUser.savedCards },
            "Card removed successfully",
        );
    } catch (error) {
        console.error("[Delete Card] Error:", error);
        return errorResponse("Failed to delete card", 500);
    }
}
