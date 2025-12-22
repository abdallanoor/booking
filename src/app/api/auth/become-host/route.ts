import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/middleware";
import { generateToken } from "@/lib/auth/jwt";
import { setAuthCookie } from "@/lib/auth/cookies";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);

    if (!user) {
      return errorResponse("Not authenticated", 401);
    }

    if (user.role === "Host") {
      return errorResponse("Already a host", 400);
    }

    // Update role
    user.role = "Host";
    await user.save();

    // Generate new token with updated role
    const token = generateToken(user._id.toString(), user.email, user.role);

    // Update cookie
    await setAuthCookie(token);

    return successResponse(
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          avatar: user.avatar,
        },
      },
      "You are now a host!"
    );
  } catch (error) {
    console.error("Become host error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update role";
    return errorResponse(message, 500);
  }
}
