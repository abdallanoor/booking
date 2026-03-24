import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Wishlist from "@/models/Wishlist";
import { requireAuth } from "@/lib/auth/auth-middleware";
import { successResponse, errorResponse } from "@/lib/api-response";
import { applyListingLocale } from "@/lib/listing-translation";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const acceptLang = req.headers.get("accept-language");
    await dbConnect();

    const wishlistItems = await Wishlist.find({ user: user._id })
      .populate({
        path: "listing",
        populate: { path: "host", select: "name avatar" },
      })
      .sort({ createdAt: -1 });

    let finalItems;
    if (acceptLang) {
      const locale = acceptLang.split(",")[0].split("-")[0].trim();
      finalItems = wishlistItems.map((item) => {
        const obj = item.toObject();
        if (obj.listing) {
          obj.listing = applyListingLocale(obj.listing, locale);
        }
        return obj;
      });
    } else {
      finalItems = wishlistItems;
    }

    return successResponse({ wishlist: finalItems });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get wishlist";

    if (message === "Unauthorized") {
      const response = errorResponse(message, 401);
      response.cookies.delete("auth_token");
      return response;
    }

    console.error("Get wishlist error:", error);
    return errorResponse(message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    await dbConnect();

    const body = await req.json();
    const { listingId } = body;

    if (!listingId) {
      return errorResponse("Listing ID is required", 400);
    }

    // Check if already in wishlist
    const existing = await Wishlist.findOne({
      user: user._id,
      listing: listingId,
    });

    if (existing) {
      return errorResponse("Listing already in wishlist", 400);
    }

    const wishlistItem = await Wishlist.create({
      user: user._id,
      listing: listingId,
    });

    await wishlistItem.populate("listing");

    return successResponse({ wishlistItem }, "Added to wishlist", 201);
  } catch (error) {
    console.error("Add to wishlist error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to add to wishlist";
    return errorResponse(message, 500);
  }
}
