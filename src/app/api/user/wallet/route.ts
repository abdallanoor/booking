import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/auth-middleware";
import { getPendingPayoutCentsForHost } from "@/services/payouts.service";

/**
 * GET /api/user/wallet
 * Return wallet balance and optional pending payout sum for the authenticated host.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, ["Host", "Admin"]);
    await dbConnect();

    const dbUser = await User.findById(user._id)
      .select("walletBalanceCents")
      .lean();
    if (!dbUser) {
      return errorResponse("User not found", 404);
    }

    const walletBalanceCents = dbUser.walletBalanceCents ?? 0;
    const pendingPayoutCents = await getPendingPayoutCentsForHost(user._id);
    const availableBalanceCents = Math.max(
      0,
      walletBalanceCents - pendingPayoutCents,
    );

    return successResponse({
      walletBalanceCents,
      pendingPayoutCents,
      availableBalanceCents,
    });
  } catch (error) {
    console.error("[Wallet GET] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to get wallet";
    return errorResponse(message, 500);
  }
}
