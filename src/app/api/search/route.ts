import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Listing from "@/models/Listing";
import Booking from "@/models/Booking";
import { successResponse, errorResponse } from "@/lib/api-response";
import { applyListingLocale } from "@/lib/listing-translation";
import { SUPPORTED_LOCALES } from "@/lib/translate";

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
        { "location.streetAddress": new RegExp(location, "i") },
        { "location.governorate": new RegExp(location, "i") },
      ];
    }

    // Filter by guest capacity
    if (guests) {
      filter.maxGuests = { $gte: parseInt(guests) };
    }

    // Filter out listings that are already booked for the selected dates
    // Only confirmed bookings block dates; pending_payment bookings don't reserve dates
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      // console.log("Search Dates:", { checkInDate, checkOutDate });

      const bookedListings = await Booking.find({
        status: "confirmed",
        $or: [
          {
            checkIn: { $lt: checkOutDate },
            checkOut: { $gt: checkInDate },
          },
        ],
      }).distinct("listing");

      const blockedCalendarListings = await import("@/models/CalendarDate").then(
        (mod) =>
          mod.default
            .find({
              isBlocked: true,
              date: {
                $gte: checkInDate,
                $lt: checkOutDate,
              },
            })
            .distinct("listing")
      );

      const allBlockedListings = [
        ...bookedListings,
        ...blockedCalendarListings,
      ];

      if (allBlockedListings.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (filter as any)._id = { $nin: allBlockedListings };
      }
    }

    const listings = await Listing.find(filter).populate("host", "name avatar");

    // Only apply translation if language header is explicitly sent
    const acceptLang = req.headers.get("accept-language");
    let finalListings;
    if (acceptLang) {
      const locale = acceptLang.split(",")[0].split("-")[0].trim();
      const effectiveLocale = (SUPPORTED_LOCALES as readonly string[]).includes(locale) ? locale : "en";
      finalListings = listings.map((l) =>
        applyListingLocale(l.toObject(), effectiveLocale)
      );
    } else {
      finalListings = listings;
    }

    return successResponse({ listings: finalListings, count: finalListings.length });
  } catch (error) {
    console.error("Search error:", error);
    const message = error instanceof Error ? error.message : "Search failed";
    return errorResponse(message, 500);
  }
}
