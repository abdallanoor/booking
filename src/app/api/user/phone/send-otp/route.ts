import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/auth-middleware";
import { sendPhoneOtp } from "@/lib/twilio";
import { successResponse, errorResponse } from "@/lib/api-response";

// E.164 format: +[country code][number], 8-15 digits total
const E164_REGEX = /^\+[1-9]\d{7,14}$/;

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const { phone } = await req.json();

    if (!phone || typeof phone !== "string") {
      return errorResponse("Phone number is required", 400);
    }

    const cleaned = phone.replace(/\s/g, "");

    if (!E164_REGEX.test(cleaned)) {
      return errorResponse(
        "Invalid phone number format. Use international format, e.g. +201234567890",
        400
      );
    }

    await sendPhoneOtp(cleaned);

    return successResponse(
      { phone: cleaned },
      "Verification code sent successfully"
    );
  } catch (error) {
    console.error("Send phone OTP error:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401);
    }

    const errorMsg =
      error instanceof Error ? error.message : "";

    // Twilio blocks certain phone prefixes due to fraud — give a friendly message
    if (
      errorMsg.includes("temporarily blocked") ||
      errorMsg.includes("fraudulent")
    ) {
      return errorResponse(
        "This phone number is temporarily unavailable for verification. Please try again later.",
        429
      );
    }

    return errorResponse(
      errorMsg || "Failed to send verification code",
      500
    );
  }
}
