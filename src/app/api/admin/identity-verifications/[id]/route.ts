import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import IdentityVerification from "@/models/IdentityVerification";
import User from "@/models/User";
import { requireRole } from "@/lib/auth/auth-middleware";
import { successResponse, errorResponse } from "@/lib/api-response";

// PATCH: Approve or reject a verification request
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole(req, ["Admin"]);
    const { id } = await params;
    const body = await req.json();
    const { action, rejectionReason } = body;

    if (!action || !["approve", "reject"].includes(action)) {
      return errorResponse('Action must be "approve" or "reject"', 400);
    }

    await dbConnect();

    const verification = await IdentityVerification.findById(id);
    if (!verification) {
      return errorResponse("Verification request not found", 404);
    }

    if (verification.status !== "pending") {
      return errorResponse(
        `This request has already been ${verification.status}`,
        400
      );
    }

    if (action === "approve") {
      // Update the verification request
      verification.status = "approved";
      verification.reviewedBy = admin._id;
      verification.reviewedAt = new Date();
      await verification.save();

      // Save the ID to the user record and mark as verified
      await User.findByIdAndUpdate(verification.user, {
        nationalId: verification.idNumber,
        identityVerified: true,
      });

      return successResponse(
        { verification },
        "Verification approved successfully"
      );
    } else {
      // Reject
      verification.status = "rejected";
      verification.reviewedBy = admin._id;
      verification.reviewedAt = new Date();
      verification.rejectionReason = rejectionReason || "";
      await verification.save();

      return successResponse(
        { verification },
        "Verification rejected"
      );
    }
  } catch (error) {
    console.error("Identity verification action error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to process verification";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return errorResponse(message, status);
  }
}
