import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Payment from "@/models/Payment";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/auth-middleware";
import { checkAvailability } from "@/lib/availability";
import {
  createPaymentIntention,
  getCheckoutUrl,
  toPiasters,
  paymobConfig,
} from "@/lib/paymob";
import { Listing } from "@/types";
import User from "@/models/User";

/**
 * POST /api/payments/initiate
 * Initiates a payment for a booking
 *
 * Request body: { bookingId: string }
 * Response: { checkoutUrl: string, paymentId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    await dbConnect();

    const body = await req.json();
    const { bookingId } = body;

    if (!bookingId) {
      return errorResponse("Booking ID is required", 400);
    }

    const dbUser = await User.findById(user._id);

    const cardTokens: string[] = [];
    if(dbUser?.savedCards && dbUser.savedCards.length > 0){
      dbUser.savedCards.forEach((card) => {
        if(card.token){
          cardTokens.push(card.token);
        }
      });
    }

    // Find the booking and verify ownership
    const booking = await Booking.findById(bookingId).populate("listing");

    if (!booking) {
      return errorResponse("Booking not found", 404);
    }

    // Verify the booking belongs to the authenticated user
    if (booking.guest.toString() !== user._id.toString()) {
      return errorResponse("Unauthorized", 403);
    }

    // Check if listing is still available (double-booking check)
    // FINAL GUARD: Validate one last time before taking money
      const listingIdStr =
      booking.listing &&
      typeof booking.listing === "object" &&
      "_id" in booking.listing
        ? (booking.listing as unknown as Listing)._id.toString()
        : String(booking.listing);

    // Check if listing is pending
    if (
      booking.listing &&
      typeof booking.listing === "object" &&
      "status" in booking.listing &&
      (booking.listing as unknown as Listing).status === "pending"
    ) {
      return errorResponse(
        "Property turned off: This property is currently not accepting reservations.",
        400,
      );
    }

    const { isAvailable, error } = await checkAvailability(
      listingIdStr,
      booking.checkIn,
      booking.checkOut,
      booking._id.toString(), // Exclude current booking from check
    );

    if (!isAvailable) {
      return errorResponse(
        error ||
          "Listing is no longer available for these dates. Someone else just booked it!",
        400,
      );
    }

    // Check if booking is in the correct state for payment
    // We allow both pending and pending_payment (legacy) for robustness
    if (booking.status !== "pending_payment") {
      return errorResponse(
        `Cannot initiate payment for booking with status: ${booking.status}`,
        400,
      );
    }

    // Check if there's already a pending payment for this booking
    const existingPayment = await Payment.findOne({
      booking: bookingId,
      status: "pending",
    });

    if (existingPayment) {
      // Return the existing checkout URL
      const checkoutUrl = getCheckoutUrl(existingPayment.paymobIntentionId);
      return successResponse({
        checkoutUrl,
        paymentId: existingPayment._id.toString(),
        message: "Using existing pending payment",
      });
    }

    // Get listing title for the payment description
    const listingTitle =
      typeof booking.listing === "object" && "title" in booking.listing
        ? (booking.listing as { title: string }).title
        : "Booking";

    // Get listing ID (handle both populated and non-populated cases)
    const listingId =
      typeof booking.listing === "object" &&
      booking.listing !== null &&
      "_id" in booking.listing
        ? // Populated case: listing is an object with _id property (ObjectId)
          (
            booking.listing as unknown as { _id: { toString(): string } }
          )._id.toString()
        : // Non-populated case: listing is an ObjectId
          (booking.listing as unknown as { toString(): string }).toString();

    // Create payment intention with Paymob
    const intentionResponse = await createPaymentIntention({
      bookingId: booking._id.toString(),
      listingId,
      amount: toPiasters(booking.totalPrice), // Convert to piasters
      currency: paymobConfig.defaultCurrency,
      customerEmail: user.email,
      customerName: user.name,
      customerPhone: user.phoneNumber,
      listingTitle,
      cardTokens,
    });

    // Create a payment record in our database
    const payment = await Payment.create({
      booking: booking._id,
      guest: user._id,
      amount: toPiasters(booking.totalPrice),
      currency: paymobConfig.defaultCurrency,
      status: "pending",
      paymobIntentionId: intentionResponse.intention_id,
    });

    // Update booking with payment reference
    booking.paymentId = payment._id;
    await booking.save();

    // Generate checkout URL
    const checkoutUrl = getCheckoutUrl(intentionResponse.client_secret);

    return successResponse(
      {
        checkoutUrl,
        paymentId: payment._id.toString(),
        intentionId: intentionResponse.intention_id,
      },
      "Payment initiated successfully",
      201,
    );
  } catch (error) {
    console.error("[Payment Initiate] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to initiate payment";
    return errorResponse(message, 500);
  }
}
