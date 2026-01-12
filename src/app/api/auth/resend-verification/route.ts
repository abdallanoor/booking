import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { generateVerificationToken } from "@/lib/auth/jwt";
import { sendVerificationEmail } from "@/lib/email/nodemailer";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const { email } = body;

    if (!email) {
      return errorResponse("Email is required", 400);
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists or not for security
      return successResponse(
        {},
        "If an account exists with this email, a verification email has been sent."
      );
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
