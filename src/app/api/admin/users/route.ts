import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { requireRole } from "@/lib/auth/auth-middleware";
import { successResponse, errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ["Admin"]);
    await dbConnect();

    const users = await User.find({}).sort({ createdAt: -1 });

    return successResponse({ users });
  } catch (error) {
    console.error("Get admin users error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to get admin users";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return errorResponse(message, status);
  }
}
