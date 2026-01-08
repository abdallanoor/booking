import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Review from "@/models/Review";
import Listing from "@/models/Listing";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth/auth-middleware";
import { isPast, differenceInHours } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);

    if (!user) {
      return successResponse({
        eligible: false,
        reason: "not_authenticated",
        message: "You must be logged in to leave a review",
      });
    }

    await dbConnect();

    const searchParams = req.nextUrl.searchParams;
    const listingId = searchParams.get("listingId");

    if (!listingId) {
      return errorResponse("Listing ID is required", 400);
    }

    // Verify listing exists
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return errorResponse("Listing not found", 404);
    }

    // Check if user already reviewed this listing (one review per listing per user)
    const existingReview = await Review.findOne({
      listing: listingId,
      guest: user._id,
    });

    if (existingReview) {
      return successResponse({
        eligible: false,
        reason: "already_reviewed",
        message: "You have already reviewed this listing",
        bookings: [],
      });
    }

    // Find all confirmed bookings for this user and listing
    const bookings = await Booking.find({
      listing: listingId,
      guest: user._id,
      status: "confirmed",
    }).sort({ checkOut: -1 }); // Most recent checkout first

    if (bookings.length === 0) {
      return successResponse({
        eligible: false,
        reason: "no_booking",
        message: "You must have a completed booking to leave a review",
        bookings: [],
      });
    }

    // Find the most recent eligible booking (auto-select)
    const now = new Date();
    let eligibleBooking = null;

    for (const booking of bookings) {
      const checkoutDate = new Date(booking.checkOut);

      // Check if checkout has passed
      if (!isPast(checkoutDate)) {
        continue; // Skip future bookings
      }

      // Check if 24 hours have passed since checkout
      const hoursSinceCheckout = differenceInHours(now, checkoutDate);
      if (hoursSinceCheckout < 24) {
        continue; // Skip bookings where 24 hours haven't passed
      }

      // Use the first eligible booking (most recent checkout)
      eligibleBooking = {
        _id: booking._id.toString(),
        checkIn: booking.checkIn.toISOString(),
        checkOut: booking.checkOut.toISOString(),
        hoursSinceCheckout: Math.floor(hoursSinceCheckout),
      };
      break; // Use the most recent eligible booking
    }

    if (!eligibleBooking) {
      return successResponse({
        eligible: false,
        reason: "no_eligible_booking",
        message:
          "You don't have any eligible bookings. Reviews can be submitted 24 hours after checkout.",
        bookings: [],
      });
    }

    return successResponse({
      eligible: true,
      booking: eligibleBooking, // Return single booking instead of array
    });
  } catch (error) {
    console.error("Check eligibility error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to check eligibility";
    return errorResponse(message, 500);
  }
}
