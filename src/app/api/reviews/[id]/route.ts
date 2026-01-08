import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Review from "@/models/Review";
import { updateReviewSchema } from "@/lib/validations/review";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/auth-middleware";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    await dbConnect();

    const { id } = await params;
    const body = await req.json();
    const validatedData = updateReviewSchema.parse(body);

    // Find the review
    const review = await Review.findById(id);

    if (!review) {
      return errorResponse("Review not found", 404);
    }

    // Verify user owns the review
    const reviewGuestId = String(review.guest);

    if (reviewGuestId !== user._id.toString()) {
      return errorResponse("You can only edit your own reviews", 403);
    }

    // Update review fields
    if (validatedData.rating !== undefined) {
      review.rating = validatedData.rating;
    }
    if (validatedData.comment !== undefined) {
      review.comment = validatedData.comment;
    }

    await review.save();

    // Populate review for response
    await review.populate("guest", "name avatar");
    await review.populate("listing", "title");
    await review.populate("booking", "checkIn checkOut");

    return successResponse({ review }, "Review updated successfully");
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "ZodError"
    ) {
      return errorResponse("Validation error", 400, error);
    }
    console.error("Update review error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update review";
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

    // Find the review
    const review = await Review.findById(id);

    if (!review) {
      return errorResponse("Review not found", 404);
    }

    // Verify user owns the review
    const reviewGuestId = String(review.guest);

    if (reviewGuestId !== user._id.toString()) {
      return errorResponse("You can only delete your own reviews", 403);
    }

    // Delete the review
    await Review.findByIdAndDelete(id);

    return successResponse({}, "Review deleted successfully");
  } catch (error) {
    console.error("Delete review error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete review";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return errorResponse(message, status);
  }
}
