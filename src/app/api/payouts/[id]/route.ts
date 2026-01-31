import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Payout from "@/models/Payout";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/auth-middleware";

/**
 * GET /api/payouts/[id]
 * Get a single payout. Host must own it; Admin can view any.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole(req, ["Host", "Admin"]);
    const { id } = await params;
    if (!id) {
      return errorResponse("Payout ID is required", 400);
    }

    await dbConnect();

    const payout = await Payout.findById(id).lean();
    if (!payout) {
      return errorResponse("Payout not found", 404);
    }

    const hostId = payout.host.toString();
    const userId = user._id.toString();
    if (user.role !== "Admin" && hostId !== userId) {
      return errorResponse("Forbidden", 403);
    }

    return successResponse({
      payout: {
        _id: payout._id,
        host: payout.host,
        amountCents: payout.amountCents,
        currency: payout.currency,
        status: payout.status,
        paymobTransactionId: payout.paymobTransactionId,
        paymobStatus: payout.paymobStatus,
        paymobStatusDescription: payout.paymobStatusDescription,
        paymobStatusCode: payout.paymobStatusCode,
        paymobEventAt: payout.paymobEventAt,
        events: payout.events,
        createdAt: payout.createdAt,
        updatedAt: payout.updatedAt,
      },
    });
  } catch (error) {
    console.error("[Payout GET] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to get payout";
    return errorResponse(message, 500);
  }
}
