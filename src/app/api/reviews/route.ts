import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Review from "@/models/Review";
import Booking from "@/models/Booking";
import Listing from "@/models/Listing";
import { reviewSchema } from "@/lib/validations/review";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/auth-middleware";
import { isPast, differenceInHours } from "date-fns";
import { Types } from "mongoose";

// Type for populated booking fields
interface PopulatedGuest {
  _id: Types.ObjectId;
  [key: string]: unknown;
}

interface PopulatedListing {
  _id: Types.ObjectId;
  [key: string]: unknown;
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    await dbConnect();

    const body = await req.json();
    const validatedData = reviewSchema.parse(body);

    // Verify listing exists
    const listing = await Listing.findById(validatedData.listingId);
    if (!listing) {
      return errorResponse("Listing not found", 404);
    }

    // Check if user already reviewed this listing (one review per listing per user)
    const existingReview = await Review.findOne({
      listing: validatedData.listingId,
      guest: user._id,
    });

    if (existingReview) {
      return errorResponse("You have already reviewed this listing", 409);
    }

    // Find the most recent eligible booking for auto-linking
    let booking;
    if (validatedData.bookingId) {
      // If bookingId is provided, verify it
      booking = await Booking.findById(validatedData.bookingId)
        .populate("listing")
        .populate("guest");

      if (!booking) {
        return errorResponse("Booking not found", 404);
      }

      // Check if booking belongs to the current user
      const bookingGuestId =
        booking.guest &&
        typeof booking.guest === "object" &&
        "_id" in booking.guest
          ? (booking.guest as unknown as PopulatedGuest)._id.toString()
          : (booking.guest as Types.ObjectId).toString();

      if (bookingGuestId !== user._id.toString()) {
        return errorResponse("You can only review your own bookings", 403);
      }

      // Check if listing ID matches
      const listingId =
        booking.listing &&
        typeof booking.listing === "object" &&
        "_id" in booking.listing
          ? (booking.listing as unknown as PopulatedListing)._id.toString()
          : (booking.listing as Types.ObjectId).toString();

      if (listingId !== validatedData.listingId) {
        return errorResponse("Listing ID does not match the booking", 400);
      }
    } else {
      // Auto-select the most recent eligible booking
      const now = new Date();
      const bookings = await Booking.find({
        listing: validatedData.listingId,
        guest: user._id,
        status: "confirmed",
      })
        .sort({ checkOut: -1 }) // Most recent checkout first
        .populate("listing")
        .populate("guest");

      // Find the first eligible booking (checkout passed + 24 hours elapsed)
      for (const b of bookings) {
        const checkoutDate = new Date(b.checkOut);
        if (isPast(checkoutDate)) {
          const hoursSinceCheckout = differenceInHours(now, checkoutDate);
          if (hoursSinceCheckout >= 24) {
            booking = b;
            break;
          }
        }
      }

      if (!booking) {
        return errorResponse(
          "No eligible booking found. Reviews can be submitted 24 hours after checkout.",
          400
        );
      }
    }

    // Check if booking is confirmed
    if (booking.status !== "confirmed") {
      return errorResponse("You can only review confirmed bookings", 400);
    }

    // Check if checkout date has passed
    const checkoutDate = new Date(booking.checkOut);
    if (!isPast(checkoutDate)) {
      return errorResponse("You can only review after checkout", 400);
    }

    // Check if 24 hours have passed since checkout
    const hoursSinceCheckout = differenceInHours(new Date(), checkoutDate);
    if (hoursSinceCheckout < 24) {
      return errorResponse(
        "You can only leave a review 24 hours after checkout",
        400
      );
    }

    // Create review (automatically linked to the selected booking)
    const review = await Review.create({
      listing: validatedData.listingId,
      guest: user._id,
      booking: booking._id,
      rating: validatedData.rating,
      comment: validatedData.comment,
    });

    // Link review to booking
    booking.reviewId = review._id;
    await booking.save();

    // Populate review for response
    await review.populate("guest", "name avatar");
    await review.populate("listing", "title");
    await review.populate("booking", "checkIn checkOut");

    return successResponse({ review }, "Review created successfully", 201);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "ZodError"
    ) {
      return errorResponse("Validation error", 400, error);
    }
    // Check for duplicate review error (unique constraint on listing + guest)
    if (
      error instanceof Error &&
      (error.message.includes("duplicate") || error.message.includes("E11000"))
    ) {
      return errorResponse("You have already reviewed this listing", 409);
    }
    console.error("Create review error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create review";
    const status =
      message === "Unauthorized"
        ? 401
        : message === "Forbidden"
        ? 403
        : message.includes("already reviewed")
        ? 409
        : 500;
    return errorResponse(message, status);
  }
}

export async function GET(req: NextRequest) {
  try {
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

    // Get all reviews for the listing
    const reviews = await Review.find({ listing: listingId })
      .populate("guest", "name avatar")
      .populate("listing", "title")
      .populate("booking", "checkIn checkOut")
      .sort({ createdAt: -1 }); // Newest first

    return successResponse({ reviews });
  } catch (error) {
    console.error("Get reviews error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to get reviews";
    return errorResponse(message, 500);
  }
}
