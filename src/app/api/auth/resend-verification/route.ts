import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth-middleware";
import { generateVerificationToken } from "@/lib/auth/jwt";
import { sendVerificationEmail } from "@/lib/email/nodemailer";
import { successResponse, errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);

    if (!user) {
      return errorResponse("Not authenticated", 401);
    }

    if (user.emailVerified) {
      return errorResponse("Email is already verified", 400);
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    user.verificationToken = verificationToken;
    await user.save();

    // Send verification email
    try {
      await sendVerificationEmail(user.email, verificationToken);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      return errorResponse(
        "Failed to send verification email. Please try again later.",
        500
      );
    }

    return successResponse({}, "Verification email sent successfully");
  } catch (error) {
    console.error("Resend verification error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to resend verification";
    return errorResponse(message, 500);
  }
}
