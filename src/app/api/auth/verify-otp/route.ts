import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { generateToken } from "@/lib/auth/jwt";
import { setAuthCookie } from "@/lib/auth/cookies";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { email, otp } = await req.json();

    if (!email || !otp) {
      return errorResponse("Email and verification code are required", 400);
    }

    // Find user with pending signup
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      otp,
      otpExpires: { $gt: new Date() },
    });

    if (!user) {
      return errorResponse("Invalid or expired verification code", 400);
    }

    // Check if user has pending signup data
    if (!user.pendingSignupData) {
      return errorResponse("No pending registration found", 400);
    }

    // Complete registration by applying pending data
    user.name = user.pendingSignupData.name;
    user.password = user.pendingSignupData.password; // Already hashed
    user.role = user.pendingSignupData.role;
    user.emailVerified = true;
    user.hasPassword = true;
    
    // Flag to skip password hashing in pre-save hook since it's already hashed
    (user as any)._skipHashing = true;
    
    // Clear OTP and pending data
    user.otp = undefined;
    user.otpExpires = undefined;
    user.pendingSignupData = undefined;
    
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id.toString(), user.email, user.role);

    // Set HTTP-only cookie
    await setAuthCookie(token);

    return successResponse(
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
        },
      },
      "Email verified successfully! Welcome to the platform.",
      200
    );
  } catch (error) {
    console.error("OTP verification error:", error);
    const message =
      error instanceof Error ? error.message : "Verification failed";
    return errorResponse(message, 500);
  }
}
