import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Listing from "@/models/Listing";
import { listingSchema } from "@/lib/validations/listing";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getCurrentUser, requireRole } from "@/lib/auth/auth-middleware";

export const dynamic = "force-dynamic";

interface ListingFilter {
  "location.city"?: RegExp;
  "location.country"?: RegExp;
  pricePerNight?: { $gte?: number; $lte?: number };
  maxGuests?: { $gte: number };
  host?: string;
  status?: string;
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const view = searchParams.get("view"); // "admin" check
    const city = searchParams.get("city");
    const country = searchParams.get("country");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const guests = searchParams.get("guests");
    const hostId = searchParams.get("hostId");
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");

    // Dashboard unification parameters
    const isDashboard = searchParams.get("dashboard") === "true";
    const statusParam = searchParams.get("status");

    let user = null;
    if (isDashboard) {
      user = await getCurrentUser(req);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: ListingFilter & { _id?: any } = {};

    // Date Availability Filtering
    // Only confirmed bookings block dates; pending_payment bookings don't reserve dates
    if (checkIn && checkOut) {
      const conflictingBookings = await import("@/models/Booking").then((mod) =>
        mod.default
          .find({
            status: "confirmed",
            $or: [
              {
                checkIn: { $lt: new Date(checkOut) },
                checkOut: { $gt: new Date(checkIn) },
              },
            ],
          })
          .select("listing")
      );

      const bookedListingIds = conflictingBookings.map((b) =>
        b.listing.toString()
      );

      if (bookedListingIds.length > 0) {
        filter._id = { $nin: bookedListingIds };
      }
    }

    if (isDashboard) {
      if (!user) {
        return errorResponse("Unauthorized", 401);
      }

      // STRICT HOSTING DASHBOARD SCOPE:
      // Both Host and Admin users should only see THEIR own listings here.
      // To see "All Listings" (Global Admin), they should use the Admin Console
      // which should pass a different param (e.g., view=admin or just not use dashboard=true with host filter).

      // Note: If you have a separate Admin Listings page that uses this endpoint,
      // it should NOT pass `dashboard=true` or it should pass `view=admin`.
      // Assuming Admin Dashboard listings might need a different flag if they use this.
      // But for now, focusing on the User Requirement: Host Page = Own Data.

      // HOST DASHBOARD SCOPE:
      // By default, show only the user's own listings (Personal Host View).
      // If user is Admin AND explicitly asks for 'admin' view, show all.
      if (user.role === "Admin" && view === "admin") {
        // GLOBAL ADMIN VIEW: See ALL listings (no host filter)
      } else {
        // HOST DASHBOARD VIEW: See ONLY own listings
        filter.host = user._id.toString();
      }

      // Allow explicit status filtering (e.g. Host clicking "Pending" tab)
      if (statusParam) {
        filter.status = statusParam;
      }
    } else {
      // Public Access: Enforce approved status
      filter.status = "approved";

      // Host filter applies in public search too
      if (hostId) filter.host = hostId;
    }

    // Common Filters (apply to both modes)
    if (city) filter["location.city"] = new RegExp(city, "i");
    if (country) filter["location.country"] = new RegExp(country, "i");
    if (minPrice || maxPrice) {
      filter.pricePerNight = {};
      if (minPrice) filter.pricePerNight.$gte = parseFloat(minPrice);
      if (maxPrice) filter.pricePerNight.$lte = parseFloat(maxPrice);
    }
    if (guests) filter.maxGuests = { $gte: parseInt(guests) };

    const listings = await Listing.find(filter)
      .populate("host", "name avatar")
      .sort({ createdAt: -1 });

    return successResponse({ listings });
  } catch (error) {
    console.error("Get listings error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to get listings";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return errorResponse(message, status);
  }
}

export async function POST(req: NextRequest) {
  try {
    // Allow both Host and Admin to create properties
    const user = await requireRole(req, ["Host", "Admin"]);
    await dbConnect();

    const body = await req.json();
    const validatedData = listingSchema.parse(body);

    const listing = await Listing.create({
      ...validatedData,
      host: user._id,
    });

    return successResponse({ listing }, "Listing created successfully", 201);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "ZodError"
    ) {
      const zodError = error as unknown as {
        issues: { message: string; path: (string | number)[] }[];
      };
      const errorMessage = zodError.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(", ");
      console.error("Validation error details:", errorMessage);
      return errorResponse(`Validation error: ${errorMessage}`, 400, error);
    }
    console.error("Create listing error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create listing";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return errorResponse(message, status);
  }
}
