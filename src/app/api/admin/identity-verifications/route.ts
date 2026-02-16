import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import IdentityVerification from "@/models/IdentityVerification";
import { requireRole } from "@/lib/auth/auth-middleware";
import { successResponse, errorResponse } from "@/lib/api-response";

// GET: List all verification requests (with optional status filter)
export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ["Admin"]);
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const filter: Record<string, string> = {};
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      filter.status = status;
    }

    const verifications = await IdentityVerification.find(filter)
      .populate("user", "name email avatar")
      .sort({ createdAt: -1 });

    return successResponse({ verifications });
  } catch (error) {
    console.error("Get identity verifications error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to get verifications";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return errorResponse(message, status);
  }
}
