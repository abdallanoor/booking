import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import dbConnect from "@/lib/mongodb";
import Property from "@/models/Property";
import { requireAuth } from "@/lib/auth/middleware";
import { propertySchema } from "@/lib/validations/property";
import { successResponse, errorResponse } from "@/lib/api-response";
import { deleteImageFromCloudinary } from "@/lib/cloudinary";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const property = await Property.findById(id).populate(
      "host",
      "name avatar email createdAt"
    );

    if (!property) {
      return errorResponse("Property not found", 404);
    }

    return successResponse({ property });
  } catch (error) {
    console.error("Get property error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to get property";
    return errorResponse(message, 500);
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

    const property = await Property.findById(id);

    if (!property) {
      return errorResponse("Property not found", 404);
    }

    // Check permissions
    if (
      property.host.toString() !== user._id.toString() &&
      user.role !== "Admin"
    ) {
      return errorResponse("Forbidden", 403);
    }

    const body = await req.json();
    const validatedData = propertySchema.parse(body);

    // Identify images to delete
    if (validatedData.images) {
      const oldImages = property.images || [];
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

    Object.assign(property, validatedData);
    await property.save();

    revalidateTag("properties", "max");
    revalidateTag(`property-${id}`, "max");

    return successResponse({ property }, "Property updated successfully");
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "ZodError"
    ) {
      return errorResponse("Validation error", 400, error);
    }
    console.error("Update property error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update property";
    return errorResponse(message, 500);
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

    const property = await Property.findById(id);
    if (!property) return errorResponse("Property not found", 404);

    // Permission Logic
    if (body.status) {
      // Status changes are typically Admin only, unless we allow Host to "cancel/hide"
      if (user.role !== "Admin") {
        // For now, strict: only Admin changes status
        return errorResponse("Forbidden: Only Admin can change status", 403);
      }
      if (!["approved", "rejected", "pending"].includes(body.status)) {
        return errorResponse("Invalid status", 400);
      }
    } else {
      // Other partial updates?
      // Ensure user is owner or admin
      if (
        property.host.toString() !== user._id.toString() &&
        user.role !== "Admin"
      ) {
        return errorResponse("Forbidden", 403);
      }
    }

    const updatedProperty = await Property.findByIdAndUpdate(id, body, {
      new: true,
    }).populate("host", "name email");

    revalidateTag("properties", "max");
    revalidateTag(`property-${id}`, "max");

    return successResponse(
      { property: updatedProperty },
      "Property updated successfully"
    );
  } catch (error) {
    console.error("Patch property error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update property";
    return errorResponse(message, 500);
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

    const property = await Property.findById(id);

    if (!property) {
      return errorResponse("Property not found", 404);
    }

    // Check restrictions
    if (
      property.host.toString() !== user._id.toString() &&
      user.role !== "Admin"
    ) {
      return errorResponse("Forbidden", 403);
    }

    // Delete all images from Cloudinary
    if (property.images && property.images.length > 0) {
      await Promise.all(
        property.images.map((img) => deleteImageFromCloudinary(img))
      );
    }

    await Property.findByIdAndDelete(id);

    revalidateTag("properties", "max");
    revalidateTag(`property-${id}`, "max");

    return successResponse(null, "Property deleted successfully");
  } catch (error) {
    console.error("Delete property error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete property";
    return errorResponse(message, 500);
  }
}
