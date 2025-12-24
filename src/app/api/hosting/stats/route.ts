import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Listing from "@/models/Listing";
import Booking from "@/models/Booking";
import { requireRole } from "@/lib/auth/auth-middleware";
import { successResponse, errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, ["Host", "Admin"]);
    await dbConnect();

    // 1. Get Host's Listings
    const hostListings = await Listing.find({ host: user._id }).select("_id");
    const hostListingIds = hostListings.map((l) => l._id);

    // 2. Aggregate Data
    // We need to query Bookings that belong to these listings
    const [
      activeListingsCount,
      pendingBookingsCount,
      upcomingGuestsCount,
      revenueAggregation,
    ] = await Promise.all([
      // Active Listings (My listings that are approved) - or just all? UI says "Active Listings"
      Listing.countDocuments({
        host: user._id,
        status: "approved",
      }),

      // Pending Bookings
      Booking.countDocuments({
        listing: { $in: hostListingIds },
        status: "pending",
      }),

      // Upcoming Guests (Confirmed bookings with checkIn in the future or today)
      Booking.countDocuments({
        listing: { $in: hostListingIds },
        status: "confirmed",
        checkIn: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)), // From start of today
          $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
        },
      }),

      // Total Earnings (Confirmed bookings)
      Booking.aggregate([
        {
          $match: {
            listing: { $in: hostListingIds },
            status: "confirmed",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalPrice" },
          },
        },
      ]),
    ]);

    const totalEarnings =
      revenueAggregation.length > 0 ? revenueAggregation[0].total : 0;

    return successResponse({
      stats: {
        activeListings: activeListingsCount,
        pendingBookings: pendingBookingsCount,
        upcomingGuests: upcomingGuestsCount,
        totalEarnings: totalEarnings,
      },
    });
  } catch (error) {
    console.error("Get hosting stats error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to get hosting stats";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return errorResponse(message, status);
  }
}
