import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import IdentityVerification from "@/models/IdentityVerification";
import User from "@/models/User";
import { requireRole } from "@/lib/auth/auth-middleware";
import { successResponse, errorResponse } from "@/lib/api-response";
import {
  sendIdentityApprovedEmail,
  sendIdentityRejectedEmail,
} from "@/lib/email/nodemailer";

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

    const verification = await IdentityVerification.findById(id).populate(
      "user",
      "name email"
    );
    if (!verification) {
      return errorResponse("Verification request not found", 404);
    }

    if (verification.status !== "pending") {
      return errorResponse(
        `This request has already been ${verification.status}`,
        400
      );
    }

    // Extract user info for email
    const user = verification.user as unknown as {
      _id: string;
      name: string;
      email: string;
    };

    if (action === "approve") {
      // Update the verification request
      verification.status = "approved";
      verification.reviewedBy = admin._id;
      verification.reviewedAt = new Date();
      await verification.save();

      // Save the ID to the user record and mark as verified
      await User.findByIdAndUpdate(user._id, {
        nationalId: verification.idNumber,
        identityVerified: true,
      });

      // Send approval email (non-blocking)
      sendIdentityApprovedEmail(user.email, {
        userName: user.name,
        idType: verification.type,
        idNumber: verification.idNumber,
      }).catch((err) =>
        console.error("Failed to send identity approved email:", err)
      );

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

      // Send rejection email (non-blocking)
      sendIdentityRejectedEmail(user.email, {
        userName: user.name,
        idType: verification.type,
        idNumber: verification.idNumber,
        rejectionReason: rejectionReason || undefined,
      }).catch((err) =>
        console.error("Failed to send identity rejected email:", err)
      );

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
