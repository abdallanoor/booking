import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Listing from "@/models/Listing";
import { requireAuth } from "@/lib/auth/auth-middleware";
import { successResponse, errorResponse } from "@/lib/api-response";
import Payment from "@/models/Payment";
import { refundTransaction } from "@/lib/paymob/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    await dbConnect();
    const { id } = await params;

    const booking = await Booking.findById(id)
      .populate({
        path: "listing",
        populate: {
          path: "host",
          select: "name email avatar",
        },
      })
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
      // Enforce 48-hour cancellation policy
      const checkInDate = new Date(booking.checkIn);
      const now = new Date();
      const hoursDifference =
        (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursDifference < 48) {
        return errorResponse(
          "Cancellation is not allowed within 48 hours of check-in",
          400
        );
      }

      // 1. Process Refund if paid
      const payment = await Payment.findOne({
        booking: booking._id,
        status: "paid",
      });

      if (payment && payment.paymobTransactionId) {
        try {
          // console.log(
          //   `[Cancellation] Processing refund for payment: ${payment._id}`
          // );
          // Multiplied by 100 because amount is stored in piasters/cents in Payment model?
          // Let's check Payment model. verify if 'amount' is in EGP or piasters.
          // Payment model says "amount: number; // Amount in piasters".
          // So we pass payment.amount directly.

          await refundTransaction(payment.paymobTransactionId, payment.amount);

          payment.status = "refunded";
          booking.paymentStatus = "refunded";
          await payment.save();
          // console.log(`[Cancellation] Refund successful`);
        } catch (refundError) {
          console.error("[Cancellation] Refund failed:", refundError);
          // We abort cancellation if refund fails to protect the guest's money
          return errorResponse(
            "Cancellation failed: Unable to process refund. Please contact support.",
            500
          );
        }
      } else if (payment && !payment.paymobTransactionId) {
        console.warn(
          `[Cancellation] Payment ${payment._id} found but missing transaction ID. Manual refund required.`
        );
        // Decide: Allow cancel but warn? Or Block?
        // For now, let's allow cancel but log it, maybe return a warning message if possible.
        // But effectively we just proceed to cancel locally.
      }

      // 2. Update Booking Status
      booking.status = "cancelled";
      await booking.save();

      const responseMessage =
        payment?.status === "refunded"
          ? "Booking cancelled and refunded successfully"
          : "Booking cancelled successfully";

      return successResponse({ booking }, responseMessage);
    }

    return errorResponse("Invalid status", 400);
  } catch (error) {
    console.error("Update booking error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update booking";
    return errorResponse(message, 500);
  }
}
