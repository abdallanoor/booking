import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Payment from "@/models/Payment";
import {
  verifyHmacSignature,
  parseWebhookPayload,
  isValidWebhookPayload,
} from "@/lib/paymob";
import type { PaymobWebhookPayload, PaymobTransactionData } from "@/lib/paymob";
import { sendBookingConfirmationEmail } from "@/lib/email/nodemailer";

/**
 * POST /api/payments/webhook
 * Handles Paymob webhook callbacks
 *
 * This endpoint is called by Paymob after a payment attempt.
 * It verifies the HMAC signature and updates the payment/booking status.
 */
export async function POST(req: NextRequest) {
  try {
    // Get the raw body for HMAC verification
    const payload = await req.json();

    // console.log("[Paymob Webhook] Received:", JSON.stringify(payload, null, 2));

    // Validate payload structure
    if (!isValidWebhookPayload(payload)) {
      console.error("[Paymob Webhook] Invalid payload structure");
      return NextResponse.json(
        { error: "Invalid payload structure" },
        { status: 400 }
      );
    }

    const webhookPayload = payload as PaymobWebhookPayload;
    const transaction = webhookPayload.obj as PaymobTransactionData;

    // Verify HMAC signature
    const hmac = req.nextUrl.searchParams.get("hmac") || webhookPayload.hmac;

    if (!hmac) {
      console.error("[Paymob Webhook] Missing HMAC signature");
      return NextResponse.json(
        { error: "Missing HMAC signature" },
        { status: 401 }
      );
    }

    const isValidSignature = verifyHmacSignature(transaction, hmac);

    if (!isValidSignature) {
      console.error("[Paymob Webhook] Invalid HMAC signature");
      return NextResponse.json(
        { error: "Invalid HMAC signature" },
        { status: 401 }
      );
    }

    // console.log("[Paymob Webhook] HMAC verified successfully");

    // Parse the webhook payload
    const paymentResult = parseWebhookPayload(webhookPayload);

    await dbConnect();

    // Find the payment by special_reference (our booking ID) or paymob order ID
    const bookingId =
      paymentResult.specialReference || transaction.order.merchant_order_id;

    let payment = await Payment.findOne({
      $or: [{ booking: bookingId }, { paymobOrderId: paymentResult.orderId }],
      status: "pending",
    }).populate("booking");

    if (!payment) {
      // Try to find by the Paymob order ID in existing payments
      payment = await Payment.findOne({
        paymobOrderId: paymentResult.orderId,
      }).populate("booking");
    }

    if (!payment) {
      console.error(
        "[Paymob Webhook] Payment not found for order:",
        paymentResult.orderId
      );
      // Return 200 to prevent Paymob from retrying
      return NextResponse.json({
        status: "ignored",
        message: "Payment not found",
      });
    }

    // Idempotency check - if payment is already processed, skip
    if (payment.status === "paid" || payment.status === "refunded") {
      // console.log("[Paymob Webhook] Payment already processed:", payment._id);
      return NextResponse.json({
        status: "already_processed",
      });
    }

    // Update payment record
    payment.paymobTransactionId = paymentResult.transactionId;
    payment.paymobOrderId = paymentResult.orderId;
    payment.paymentMethod = paymentResult.paymentMethod;

    if (transaction.source_data.pan) {
      payment.cardLastFour = transaction.source_data.pan;
    }
    if (transaction.source_data.sub_type) {
      payment.cardBrand = transaction.source_data.sub_type;
    }

    if (paymentResult.success) {
      // Payment successful
      payment.status = "paid";
      payment.paidAt = new Date();

      // Update booking status
      const booking = await Booking.findById(payment.booking)
        .populate("listing")
        .populate("guest");

      if (booking) {
        booking.status = "confirmed";
        booking.paymentStatus = "paid";
        await booking.save();

        // Send confirmation email
        try {
          const guestEmail =
            booking.guest &&
            typeof booking.guest === "object" &&
            "email" in booking.guest
              ? (booking.guest as { email: string }).email
              : null;

          const listingTitle =
            booking.listing &&
            typeof booking.listing === "object" &&
            "title" in booking.listing
              ? (booking.listing as { title: string }).title
              : "Your booking";

          if (guestEmail) {
            await sendBookingConfirmationEmail(guestEmail, {
              listingTitle,
              checkIn: booking.checkIn,
              checkOut: booking.checkOut,
              totalPrice: booking.totalPrice,
              transactionId: paymentResult.transactionId,
            });
            // console.log(
            //   "[Paymob Webhook] Confirmation email sent to:",
            //   guestEmail
            // );
          }
        } catch (emailError) {
          console.error(
            "[Paymob Webhook] Failed to send confirmation email:",
            emailError
          );
          // Don't fail the webhook for email errors
        }
      }

      // console.log(
      //   "[Paymob Webhook] Payment successful for booking:",
      //   payment.booking
      // );
    } else {
      // Payment failed
      payment.status = "failed";
      payment.errorMessage =
        paymentResult.errorMessage || "Payment was declined";

      // Update booking payment status
      const booking = await Booking.findById(payment.booking);
      if (booking) {
        booking.paymentStatus = "failed";
        await booking.save();
      }

      // console.log(
      //   "[Paymob Webhook] Payment failed for booking:",
      //   payment.booking,
      //   paymentResult.errorMessage
      // );
    }

    await payment.save();

    return NextResponse.json({
      status: "processed",
      paymentStatus: payment.status,
    });
  } catch (error) {
    console.error("[Paymob Webhook] Error:", error);
    // Return 200 to prevent infinite retries from Paymob
    return NextResponse.json({
      status: "error",
      message: error instanceof Error ? error.message : "Internal error",
    });
  }
}

// Also handle GET for Paymob callback URL verification
export async function GET() {
  return NextResponse.json({
    status: "active",
    message: "Paymob webhook endpoint is active",
  });
}
