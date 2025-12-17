import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Property from "@/models/Property";
import { requireAuth } from "@/lib/auth/middleware";
import { bookingSchema } from "@/lib/validations/booking";
import { successResponse, errorResponse } from "@/lib/api-response";

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
      if (user.role === "Admin") {
        // Admin sees all bookings
        query = {};
      } else {
        // Host sees bookings for their properties
        const propertyIds = await Property.find({ host: user._id }).distinct(
          "_id"
        );
        query = { property: { $in: propertyIds } };
      }
    } else {
      // Default behavior (legacy/fallback): Mix of both
      if (user.role === "Admin") {
        query = {};
      } else {
        const propertyIds = await Property.find({ host: user._id }).distinct(
          "_id"
        );
        query = {
          $or: [{ guest: user._id }, { property: { $in: propertyIds } }],
        };
      }
    }

    const bookings = await Booking.find(query)
      .populate("property")
      .populate("guest", "name email")
      .sort({ createdAt: -1 });

    return successResponse({ bookings });
  } catch (error) {
    console.error("Get bookings error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to get bookings";
    return errorResponse(message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    await dbConnect();

    const body = await req.json();
    const validatedData = bookingSchema.parse(body);

    const property = await Property.findById(validatedData.propertyId);

    if (!property) {
      return errorResponse("Property not found", 404);
    }

    // Check if property can accommodate guests
    if (validatedData.guests > property.maxGuests) {
      return errorResponse(
        `Property can only accommodate ${property.maxGuests} guests`,
        400
      );
    }

    const checkInDate = new Date(validatedData.checkIn);
    const checkOutDate = new Date(validatedData.checkOut);

    // Calculate total price
    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const totalPrice = property.pricePerNight * nights;

    const booking = await Booking.create({
      property: property._id,
      guest: user._id,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests: validatedData.guests,
      totalPrice,
      status: "confirmed",
    });

    await booking.populate("property");

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
