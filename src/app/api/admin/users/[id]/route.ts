import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/auth-middleware";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(req, ["Admin"]);
    const { id } = await params;
    const body = await req.json();
    const { isBlocked } = body;

    if (typeof isBlocked !== "boolean") {
      return errorResponse("isBlocked must be a boolean", 400);
    }

    await dbConnect();

    const user = await User.findByIdAndUpdate(
      id,
      { isBlocked },
      { new: true, runValidators: true }
    );

    if (!user) {
      return errorResponse("User not found", 404);
    }

    return successResponse({ user });
  } catch (error) {
    console.error("Update admin user error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update admin user";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return errorResponse(message, status);
  }
}

// DELETE method removed as per requirements: admin can only "block user"
