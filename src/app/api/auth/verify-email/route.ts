import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return errorResponse("Verification token is required", 400);
    }

    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return errorResponse("Invalid or expired verification token", 400);
    }

    user.emailVerified = true;
    user.verificationToken = undefined;
    await user.save();

    return successResponse(
      { emailVerified: true },
      "Email verified successfully"
    );
  } catch (error) {
    console.error("Email verification error:", error);
    const message =
      error instanceof Error ? error.message : "Email verification failed";
    return errorResponse(message, 500);
  }
}
