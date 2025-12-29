import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth-middleware";
import { successResponse, errorResponse } from "@/lib/api-response";
import bcrypt from "bcryptjs";
import User from "@/models/User";

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);

    if (!user) {
      return errorResponse("Not authenticated", 401);
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!newPassword || newPassword.length < 6) {
      return errorResponse("Password must be at least 6 characters", 400);
    }

    // If user has a password, verify current password
    // Use hasPassword flag as the source of truth
    if (user.hasPassword) {
      if (!currentPassword) {
        return errorResponse("Current password is required", 400);
      }

      // Explicitly fetch user with password
      const userWithPassword = await User.findById(user._id).select("password");
      if (!userWithPassword || !userWithPassword.password) {
        // Should not happen if hasPassword is true, but handle gracefully
        return errorResponse("User password not found", 500);
      }

      const isMatch = await bcrypt.compare(
        currentPassword,
        userWithPassword.password
      );
      if (!isMatch) {
        return errorResponse("Incorrect current password", 400);
      }
    }

    // Hash new password (if not handled by pre-save hook, but usually better to let model handle it or do it here)
    // The model pre-save hook handles hashing if password is modified.
    // Let's rely on the model or do it manually if we want to be explicit.
    // Since we are setting user.password, the pre-save hook in User.ts should kick in.
    // Let's check User.ts again. It says:
    // if (!this.isModified("password") || !this.password) return;
    // So if we set user.password = newPassword, then save(), it should hash.

    user.password = newPassword;
    user.hasPassword = true;
    await user.save();

    return successResponse({
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Update password error:", error);
    return errorResponse("Failed to update password", 500);
  }
}
