import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/auth-middleware";
import { verifyPhoneOtp } from "@/lib/twilio";
import User from "@/models/User";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const { phone, code } = await req.json();

    if (!phone || !code) {
      return errorResponse("Phone number and verification code are required", 400);
    }

    const cleaned = phone.replace(/\s/g, "");

    const check = await verifyPhoneOtp(cleaned, code);

    if (check.status !== "approved") {
      return errorResponse("Invalid or expired verification code", 400);
    }

    // OTP verified — save phone number to user
    await User.findByIdAndUpdate(user._id, { phoneNumber: cleaned });

    return successResponse(
      { phone: cleaned },
      "Phone number verified successfully"
    );
  } catch (error) {
    console.error("Verify phone OTP error:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401);
    }

    const message =
      error instanceof Error ? error.message : "Verification failed";
    return errorResponse(message, 500);
  }
}
