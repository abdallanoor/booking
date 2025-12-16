import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { resetPasswordSchema } from "@/lib/validations/forgot-password";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const validatedData = resetPasswordSchema.parse(body);

    // Find user by reset token
    const user = await User.findOne({
      resetPasswordToken: validatedData.token,
    });

    if (!user) {
      return errorResponse("Invalid or expired reset token", 400);
    }

    // Check token expiration
    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      return errorResponse("Reset token has expired", 400);
    }

    // Only allow password reset for local provider users
    if (user.provider !== "local") {
      return errorResponse(
        "Password reset is not available for this account",
        400
      );
    }

    // Update password (will be hashed by pre-save hook)
    user.password = validatedData.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return successResponse(
      { message: "Password reset successful" },
      "Password has been reset successfully"
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
    console.error("Reset password error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to reset password";
    return errorResponse(message, 500);
  }
}
