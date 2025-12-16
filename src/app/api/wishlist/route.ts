import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Wishlist from "@/models/Wishlist";
import { requireAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    await dbConnect();

    const wishlistItems = await Wishlist.find({ user: user._id })
      .populate({
        path: "property",
        populate: { path: "host", select: "name avatar" },
      })
      .sort({ createdAt: -1 });

    return successResponse({ wishlist: wishlistItems });
  } catch (error) {
    console.error("Get wishlist error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to get wishlist";
    return errorResponse(message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    await dbConnect();

    const body = await req.json();
    const { propertyId } = body;

    if (!propertyId) {
      return errorResponse("Property ID is required", 400);
    }

    // Check if already in wishlist
    const existing = await Wishlist.findOne({
      user: user._id,
      property: propertyId,
    });

    if (existing) {
      return errorResponse("Property already in wishlist", 400);
    }

    const wishlistItem = await Wishlist.create({
      user: user._id,
      property: propertyId,
    });

    await wishlistItem.populate("property");

    return successResponse({ wishlistItem }, "Added to wishlist", 201);
  } catch (error) {
    console.error("Add to wishlist error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to add to wishlist";
    return errorResponse(message, 500);
  }
}
