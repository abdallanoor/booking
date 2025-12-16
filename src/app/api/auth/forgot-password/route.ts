import { NextRequest } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { forgotPasswordSchema } from "@/lib/validations/forgot-password";
import { sendPasswordResetEmail } from "@/lib/email/nodemailer";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const validatedData = forgotPasswordSchema.parse(body);

    // Find user by email
    const user = await User.findOne({ email: validatedData.email });

    // Always return success to prevent email enumeration
    // Even if user doesn't exist, we return success for security
    if (!user) {
      return successResponse(
        {
          message:
            "If your email is registered, you will receive a password reset link.",
        },
        "Password reset email sent"
      );
    }

    // Only allow password reset for local provider users
    if (user.provider !== "local") {
      return successResponse(
        {
          message:
            "If your email is registered, you will receive a password reset link.",
        },
        "Password reset email sent"
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Set token and expiration (1 hour from now)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    // Send reset email
    await sendPasswordResetEmail(user.email, resetToken);

    return successResponse(
      {
        message:
          "If your email is registered, you will receive a password reset link.",
      },
      "Password reset email sent"
    );
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "ZodError"
    ) {
      return errorResponse("Validation error", 400, error);
    }
    console.error("Forgot password error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to process request";
    return errorResponse(message, 500);
  }
}
