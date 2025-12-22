import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Listing from "@/models/Listing";
import Booking from "@/models/Booking";
import { successResponse, errorResponse } from "@/lib/api-response";

interface SearchFilter {
  $or?: Array<{ [key: string]: RegExp }>;
  maxGuests?: { $gte: number };
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const location = searchParams.get("location");
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");
    const guests = searchParams.get("guests");

    const filter: SearchFilter = {};

    // Filter by location
    if (location) {
      filter.$or = [
        { "location.city": new RegExp(location, "i") },
        { "location.country": new RegExp(location, "i") },
        { "location.address": new RegExp(location, "i") },
      ];
    }

    // Filter by guest capacity
    if (guests) {
      filter.maxGuests = { $gte: parseInt(guests) };
    }

    let listings = await Listing.find(filter).populate("host", "name avatar");

    // Filter out listings that are already booked for the selected dates
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);

      const bookedListings = await Booking.find({
        status: { $ne: "cancelled" },
        $or: [
          {
            checkIn: { $lte: checkOutDate },
            checkOut: { $gte: checkInDate },
          },
        ],
      }).distinct("listing");

      listings = listings.filter(
        (listing) =>
          !bookedListings.some(
            (bookedId) => bookedId.toString() === listing._id.toString()
          )
      );
    }

    return successResponse({ listings, count: listings.length });
  } catch (error) {
    console.error("Search error:", error);
    const message = error instanceof Error ? error.message : "Search failed";
    return errorResponse(message, 500);
  }
}
