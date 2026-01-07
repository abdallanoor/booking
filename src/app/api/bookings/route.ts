import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Listing from "@/models/Listing";
import { bookingSchema } from "@/lib/validations/booking";
import { successResponse, errorResponse } from "@/lib/api-response";
import {
  requireAuth,
  requireProfileCompletion,
} from "@/lib/auth/auth-middleware";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    await dbConnect();

    const searchParams = req.nextUrl.searchParams;
    const view = searchParams.get("view"); // "guest" or "host"

    let query = {};

    if (view === "guest") {
      // User sees only bookings they created
      query = { guest: user._id };
    } else if (view === "host") {
      // HOST VIEW: Strict personal scoping
      // Even Admins should only see their own listings' bookings here
      const listingIds = await Listing.find({ host: user._id }).distinct("_id");
      query = { listing: { $in: listingIds } };
    } else {
      // GLOBAL/ADMIN VIEW (or legacy fallback)
      if (user.role === "Admin") {
        query = {};
      } else {
        // Fallback for non-admin on generic view: show relevant stuff
        const listingIds = await Listing.find({ host: user._id }).distinct(
          "_id"
        );
        query = {
          $or: [{ guest: user._id }, { listing: { $in: listingIds } }],
        };
      }
    }

    const bookings = await Booking.find(query)
      .populate("listing")
      .populate("guest", "name email")
      .sort({ createdAt: -1 });

    return successResponse({ bookings });
  } catch (error) {
    console.error("Get bookings error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to get bookings";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return errorResponse(message, status);
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check if user profile is complete for booking
    const user = await requireProfileCompletion(req, "book");
    await dbConnect();

    const body = await req.json();
    const validatedData = bookingSchema.parse(body);

    const listing = await Listing.findById(validatedData.listingId);

    if (!listing) {
      return errorResponse("Listing not found", 404);
    }

    // Check if listing can accommodate guests
    if (validatedData.guests > listing.maxGuests) {
      return errorResponse(
        `Listing can only accommodate ${listing.maxGuests} guests`,
        400
      );
    }

    const checkInDate = new Date(validatedData.checkIn);
    const checkOutDate = new Date(validatedData.checkOut);

    // Calculate total price
    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const totalPrice = listing.pricePerNight * nights;

    const booking = await Booking.create({
      listing: listing._id,
      guest: user._id,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests: validatedData.guests,
      totalPrice,
      status: "pending_payment",
      paymentStatus: "pending",
    });

    await booking.populate("listing");

    return successResponse({ booking }, "Booking created successfully", 201);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "ZodError"
    ) {
      return errorResponse("Validation error", 400, error);
    }
    // Check for double booking error
    if (error instanceof Error && error.message.includes("already booked")) {
      return errorResponse(error.message, 409);
    }
    console.error("Create booking error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create booking";
    return errorResponse(message, 500);
  }
}
