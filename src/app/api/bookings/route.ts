import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Listing from "@/models/Listing";
import CalendarDate from "@/models/CalendarDate";
import { bookingSchema } from "@/lib/validations/booking";
import { successResponse, errorResponse } from "@/lib/api-response";
import {
  requireAuth,
  requireProfileCompletion,
} from "@/lib/auth/auth-middleware";
import { checkAvailability } from "@/lib/availability";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    await dbConnect();

    const searchParams = req.nextUrl.searchParams;
    const view = searchParams.get("view"); // "guest" or "host"
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    let query = {};

    if (view === "guest") {
      // User sees only bookings they created
      query = { guest: user._id };
    } else if (view === "host") {
      // HOST VIEW: Strict personal scoping
      // Even Admins should only see their own listings' bookings here
      const listingIds = await Listing.find({ host: user._id }).distinct("_id");
      query = { 
        listing: { $in: listingIds },
        status: "confirmed" // User requested confirmed only for host view
      };
    } else {
      // GLOBAL/ADMIN VIEW (or legacy fallback)
      if (user.role === "Admin") {
        query = {};
      } else {
        // Fallback for non-admin on generic view: show relevant stuff
        const listingIds = await Listing.find({ host: user._id }).distinct(
          "_id",
        );
        query = {
          $or: [{ guest: user._id }, { listing: { $in: listingIds } }],
        };
      }
    }

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate("listing")
      .populate("guest", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return successResponse({
      bookings,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
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
        400,
      );
    }

    const checkInDate = new Date(validatedData.checkIn);
    const checkOutDate = new Date(validatedData.checkOut);

    // Server-side availability check (includes CalendarDate blocked days)
    const availabilityResult = await checkAvailability(
      validatedData.listingId,
      checkInDate,
      checkOutDate,
    );

    if (!availabilityResult.isAvailable) {
      return errorResponse(availabilityResult.error || "Dates not available", 409);
    }

    // Calculate total price with weekend pricing and custom per-day prices
    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Fetch all CalendarDate entries for this booking range
    const calendarDates = await CalendarDate.find({
      listing: validatedData.listingId,
      date: { $gte: checkInDate, $lt: checkOutDate },
    }).lean();

    // Create a map of date -> custom price for quick lookup
    const customPriceMap = new Map<string, number>();
    for (const cd of calendarDates) {
      if (cd.customPrice !== undefined && cd.customPrice !== null) {
        const dateKey = cd.date.toISOString().split("T")[0];
        customPriceMap.set(dateKey, cd.customPrice);
      }
    }

    let baseTotal = 0;
    const current = new Date(checkInDate);
    
    // Loop through each night
    while (current < checkOutDate) {
      const dateKey = current.toISOString().split("T")[0];
      
      // Check for custom price override first
      if (customPriceMap.has(dateKey)) {
        baseTotal += customPriceMap.get(dateKey)!;
      } else {
        // Fall back to weekend/weekday pricing
        const day = current.getDay();
        const isWeekend = day === 5 || day === 6; // Friday (5) or Saturday (6)
        
        const nightlyRate = (isWeekend && listing.weekendPrice && listing.weekendPrice > 0) 
          ? listing.weekendPrice 
          : listing.pricePerNight;
          
        baseTotal += nightlyRate;
      }
      
      current.setDate(current.getDate() + 1);
    }

    // Apply discounts
    let discountPercent = 0;
    if (nights >= 28 && listing.discounts?.monthly) {
      discountPercent = listing.discounts.monthly;
    } else if (nights >= 7 && listing.discounts?.weekly) {
      discountPercent = listing.discounts.weekly;
    }

    const discountAmount = Math.round(baseTotal * (discountPercent / 100));
    const totalPrice = Math.max(0, baseTotal - discountAmount);

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
