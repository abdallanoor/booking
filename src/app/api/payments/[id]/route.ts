import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Payment from "@/models/Payment";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/auth-middleware";

/**
 * GET /api/payments/[id]
 * Get payment status and details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    await dbConnect();

    const { id } = await params;

    const payment = await Payment.findById(id)
      .populate({
        path: "booking",
        populate: {
          path: "listing",
          select: "title images location",
        },
      })
      .populate("guest", "name email");

    if (!payment) {
      return errorResponse("Payment not found", 404);
    }

    // Verify the payment belongs to the authenticated user
    const guestId = payment.guest._id
      ? payment.guest._id.toString()
      : payment.guest.toString();
    if (guestId !== user._id.toString() && user.role !== "Admin") {
      return errorResponse("Unauthorized", 403);
    }

    return successResponse({
      payment: {
        _id: payment._id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.paymentMethod,
        cardLastFour: payment.cardLastFour,
        cardBrand: payment.cardBrand,
        paidAt: payment.paidAt,
        createdAt: payment.createdAt,
        booking: payment.booking,
      },
    });
  } catch (error) {
    console.error("[Payment Get] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to get payment";
    return errorResponse(message, 500);
  }
}

/**
 * GET /api/payments/by-booking/[bookingId]
 * This is handled by creating a separate endpoint, but for convenience,
 * we also support looking up by booking ID
 */
