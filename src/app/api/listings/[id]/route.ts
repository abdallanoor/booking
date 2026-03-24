import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Listing from "@/models/Listing";
import { listingSchema } from "@/lib/validations/listing";
import { successResponse, errorResponse } from "@/lib/api-response";
import { deleteImageFromCloudinary } from "@/lib/cloudinary";
import { requireAuth } from "@/lib/auth/auth-middleware";
import { triggerListingTranslation, applyListingLocale } from "@/lib/listing-translation";
import { SUPPORTED_LOCALES } from "@/lib/translate";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const listing = await Listing.findById(id).populate(
      "host",
      "name avatar email createdAt"
    );

    if (!listing) {
      return errorResponse("Listing not found", 404);
    }

    const isOriginal = req.nextUrl.searchParams.get("original") === "true";
    if (isOriginal) {
      return successResponse({ listing });
    }

    // Only apply translation if language header is explicitly sent
    const acceptLang = req.headers.get("accept-language");
    if (acceptLang) {
      const locale = acceptLang.split(",")[0].split("-")[0].trim();
      const effectiveLocale = (SUPPORTED_LOCALES as readonly string[]).includes(locale) ? locale : "en";
      const localizedListing = applyListingLocale(listing.toObject(), effectiveLocale);
      return successResponse({ listing: localizedListing });
    }

    return successResponse({ listing });
  } catch (error) {
    console.error("Get listing error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to get listing";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return errorResponse(message, status);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Both Host and Admin can update
    const user = await requireAuth(req);
    await dbConnect();
    const { id } = await params;

    const listing = await Listing.findById(id);

    if (!listing) {
      return errorResponse("Listing not found", 404);
    }

    // Check permissions
    if (
      listing.host.toString() !== user._id.toString() &&
      user.role !== "Admin"
    ) {
      return errorResponse("Forbidden", 403);
    }

    const body = await req.json();
    const validatedData = listingSchema.parse(body);

    // Identify images to delete
    if (validatedData.images) {
      const oldImages = listing.images || [];
      const newImages = validatedData.images;

      // Find images that are in oldImages but not in newImages
      const imagesToDelete = oldImages.filter(
        (img) => !newImages.includes(img)
      );

      // Delete them from Cloudinary using parallel execution
      if (imagesToDelete.length > 0) {
        await Promise.all(
          imagesToDelete.map((img) => deleteImageFromCloudinary(img))
        );
      }
    }

    Object.assign(listing, validatedData);
    
    // If a Host modifies a listing, set its status to "pending" for Admin review
    // We intentionally DO NOT clear rejectionReason so the admin can remember why it was rejected
    if (user.role === "Host") {
      listing.status = "pending";
    }

    await listing.save();

    // Fire-and-forget: trigger translation in background
    triggerListingTranslation(listing._id.toString(), {
      title: validatedData.title,
      description: validatedData.description,
      amenities: validatedData.amenities,
      policies: validatedData.policies,
    }).catch((err) =>
      console.error("[Translation] Background translation failed:", err)
    );

    return successResponse({ listing }, "Listing updated successfully");
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "ZodError"
    ) {
      return errorResponse("Validation error", 400, error);
    }
    console.error("Update listing error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update listing";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return errorResponse(message, status);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    await dbConnect();
    const { id } = await params;

    // We expect { status: ... } or other partial updates
    const body = await req.json();

    const listing = await Listing.findById(id);
    if (!listing) return errorResponse("Listing not found", 404);

    // Permission Logic
    if (body.status) {
      if (user.role !== "Admin") {
        return errorResponse("Forbidden: Only Admin can change status", 403);
      }
      
      if (!["approved", "rejected", "pending"].includes(body.status)) {
        return errorResponse("Invalid status", 400);
      }
      
      // Note: We intentionally don't clear rejectionReason automatically here 
      // so Admins can reference the past rejection reason even after resubmission.
    } else {
      // Other partial updates?
      // Ensure user is owner or admin
      if (
        listing.host.toString() !== user._id.toString() &&
        user.role !== "Admin"
      ) {
        return errorResponse("Forbidden", 403);
      }
    }

    const updatedListing = await Listing.findByIdAndUpdate(id, body, {
      new: true,
    }).populate("host", "name email");

    return successResponse(
      { listing: updatedListing },
      "Listing updated successfully"
    );
  } catch (error) {
    console.error("Patch listing error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update listing";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return errorResponse(message, status);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    await dbConnect();
    const { id } = await params;

    const listing = await Listing.findById(id);

    if (!listing) {
      return errorResponse("Listing not found", 404);
    }

    // Check restrictions
    if (
      listing.host.toString() !== user._id.toString() &&
      user.role !== "Admin"
    ) {
      return errorResponse("Forbidden", 403);
    }

    // Delete all images from Cloudinary
    if (listing.images && listing.images.length > 0) {
      await Promise.all(
        listing.images.map((img) => deleteImageFromCloudinary(img))
      );
    }

    await Listing.findByIdAndDelete(id);

    return successResponse(null, "Listing deleted successfully");
  } catch (error) {
    console.error("Delete listing error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete listing";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return errorResponse(message, status);
  }
}
