import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import IdentityVerification from "@/models/IdentityVerification";
import { requireAuth } from "@/lib/auth/auth-middleware";
import { successResponse, errorResponse } from "@/lib/api-response";
import { deleteImageFromCloudinary } from "@/lib/cloudinary";

// GET: Get user's latest verification request
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    await dbConnect();

    const verification = await IdentityVerification.findOne({
      user: user._id,
    }).sort({ createdAt: -1 });

    return successResponse({ verification: verification || null });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get verification";
    const status = message === "Unauthorized" ? 401 : 500;
    return errorResponse(message, status);
  }
}

// POST: Submit a new verification request
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    await dbConnect();

    // Check if user already has a verified identity
    if (user.identityVerified) {
      return errorResponse("Your identity is already verified", 400);
    }

    // Check if there's already any request
    const existingRequest = await IdentityVerification.findOne({
      user: user._id,
    });

    if (existingRequest) {
      if (existingRequest.status === "pending") {
        return errorResponse(
          "You already have a pending verification request",
          400
        );
      }
      if (existingRequest.status === "approved") {
        return errorResponse("Your identity is already verified", 400);
      }
    }

    const body = await req.json();
    const { type, idNumber, imageUrl } = body;

    // Validate
    if (!type || !["national_id", "passport"].includes(type)) {
      return errorResponse("Invalid document type", 400);
    }
    if (!idNumber || idNumber.trim().length < 3) {
      return errorResponse("ID number must be at least 3 characters", 400);
    }
    if (!imageUrl) {
      return errorResponse("Document image is required", 400);
    }

    let verification;

    if (existingRequest) {
      // Delete old image if it has changed
      if (existingRequest.imageUrl && existingRequest.imageUrl !== imageUrl) {
        await deleteImageFromCloudinary(existingRequest.imageUrl).catch(
          (err) => console.error("Failed to delete old identity image:", err)
        );
      }

      // Update existing rejected request
      existingRequest.type = type;
      existingRequest.idNumber = idNumber.trim();
      existingRequest.imageUrl = imageUrl;
      existingRequest.status = "pending";
      existingRequest.rejectionReason = undefined;
      verification = await existingRequest.save();
    } else {
      // Create verification request
      verification = await IdentityVerification.create({
        user: user._id,
        type,
        idNumber: idNumber.trim(),
        imageUrl,
        status: "pending",
      });
    }

    return successResponse(
      { verification },
      "Verification request submitted successfully",
      existingRequest ? 200 : 201
    );
  } catch (error) {
    console.error("Identity verification submission error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to submit verification request";
    const status = message === "Unauthorized" ? 401 : 500;
    return errorResponse(message, status);
  }
}
