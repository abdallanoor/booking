import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import IdentityVerification from "@/models/IdentityVerification";
import { requireAuth } from "@/lib/auth/auth-middleware";
import { successResponse, errorResponse } from "@/lib/api-response";

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

    // Check if there's already a pending request
    const existingPending = await IdentityVerification.findOne({
      user: user._id,
      status: "pending",
    });

    if (existingPending) {
      return errorResponse(
        "You already have a pending verification request",
        400
      );
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

    // Create verification request
    const verification = await IdentityVerification.create({
      user: user._id,
      type,
      idNumber: idNumber.trim(),
      imageUrl,
      status: "pending",
    });

    return successResponse(
      { verification },
      "Verification request submitted successfully",
      201
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
