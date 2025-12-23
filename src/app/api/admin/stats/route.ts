import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Listing from "@/models/Listing";
import Booking from "@/models/Booking";
import User from "@/models/User";
import { requireRole } from "@/lib/auth/auth-middleware";
import { successResponse, errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ["Admin"]);
    await dbConnect();

    // Parallelize queries for performance
    const [
      userCount,
      listingCount,
      pendingListingCount,
      bookingCount,
      revenueAggregation,
    ] = await Promise.all([
      User.countDocuments(),
      Listing.countDocuments({ status: "approved" }), // "Active" listings
      Listing.countDocuments({ status: "pending" }), // Pending listings
      Booking.countDocuments(),
      Booking.aggregate([
        { $match: { status: "confirmed" } }, // Only count confirmed bookings for revenue
        {
          $group: {
            _id: null,
            total: { $sum: "$totalPrice" },
          },
        },
      ]),
    ]);

    const totalRevenue =
      revenueAggregation.length > 0 ? revenueAggregation[0].total : 0;

    return successResponse({
      stats: {
        totalUsers: userCount,
        activeListings: listingCount,
        pendingListings: pendingListingCount,
        totalBookings: bookingCount,
        revenue: totalRevenue,
      },
    });
  } catch (error) {
    console.error("Get admin stats error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to get admin stats";
    return errorResponse(message, 500);
  }
}
