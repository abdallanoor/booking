import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);

    if (!user) {
      return errorResponse("Not authenticated", 401);
    }

    return successResponse({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to get user";
    return errorResponse(message, 500);
  }
}
