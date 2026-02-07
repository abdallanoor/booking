import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { generateOtp } from "@/lib/auth/jwt";
import { sendOtpEmail } from "@/lib/email/nodemailer";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { email } = await req.json();

    if (!email) {
      return errorResponse("Email is required", 400);
    }

    // Find user with pending signup (not verified yet)
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      emailVerified: false,
      pendingSignupData: { $exists: true },
    });

    if (!user) {
      return errorResponse("No pending registration found for this email", 400);
    }

    // Generate new OTP
    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP email
    try {
      await sendOtpEmail(user.email, otp);
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
      return errorResponse("Failed to send verification code. Please try again.", 500);
    }

    return successResponse(
      {
        email: user.email,
      },
      "New verification code sent! Please check your email.",
      200
    );
  } catch (error) {
    console.error("Resend OTP error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to resend code";
    return errorResponse(message, 500);
  }
}
