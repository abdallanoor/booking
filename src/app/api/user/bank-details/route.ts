import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/auth-middleware";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { successResponse, errorResponse } from "@/lib/api-response";
import { bankDetailsSchema } from "@/lib/validations/payout";

/**
 * GET /api/user/bank-details
 * Retrieve the current user's bank details
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    // No need to fetch from DB again if requireAuth returns just ID/Email/Role,
    // but usually requireAuth might return a lightweight object.
    // Let's verify if we need to fetch the full user.
    // Usually fetching from DB ensures latest data.
    await dbConnect();
    const currentUser = await User.findById(user._id).select("bankDetails");

    if (!currentUser) {
      return errorResponse("User not found", 404);
    }

    return successResponse(
      { bankDetails: currentUser.bankDetails },
      "Bank details retrieved successfully",
    );
  } catch (error) {
    console.error("[Get Bank Details] Error:", error);
    return errorResponse("Failed to retrieve bank details", 500);
  }
}

/**
 * POST /api/user/bank-details
 * Add or Update bank details
 * Body: { bankCode, fullName, accountNumber?, iban? }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    await dbConnect();

    const body = await req.json();

    // Validate using Zod
    const validationResult = bankDetailsSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMessage = validationResult.error.issues
        .map((e) => e.message)
        .join(", ");
      return errorResponse(errorMessage, 400);
    }

    const bankDetails = validationResult.data;

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $set: { bankDetails: bankDetails },
      },
      { new: true, runValidators: true },
    ).select("bankDetails");

    if (!updatedUser) {
      return errorResponse("User not found", 404);
    }

    return successResponse(
      { bankDetails: updatedUser.bankDetails },
      "Bank details saved successfully",
    );
  } catch (error) {
    console.error("[Save Bank Details] Error:", error);
    return errorResponse("Failed to save bank details", 500);
  }
}

/**
 * DELETE /api/user/bank-details
 * Remove bank details
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    await dbConnect();

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $unset: { bankDetails: 1 },
      },
      { new: true },
    ).select("bankDetails");

    if (!updatedUser) {
      return errorResponse("User not found", 404);
    }

    return successResponse(
      { bankDetails: null },
      "Bank details removed successfully",
    );
  } catch (error) {
    console.error("[Delete Bank Details] Error:", error);
    return errorResponse("Failed to remove bank details", 500);
  }
}
