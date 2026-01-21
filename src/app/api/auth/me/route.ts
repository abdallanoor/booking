import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth-middleware";
import { successResponse, errorResponse } from "@/lib/api-response";
import { deleteImageFromCloudinary } from "@/lib/cloudinary";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);

    if (!user) {
      const response = errorResponse("Not authenticated", 401);
      response.cookies.delete("auth_token");
      return response;
    }

    return successResponse({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        phoneNumber: user.phoneNumber,
        country: user.country,
        nationalId: user.nationalId,
        profileCompleted: user.profileCompleted,
        hasPassword: user.hasPassword,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to get user";
    return errorResponse(message, 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);

    if (!user) {
      return errorResponse("Not authenticated", 401);
    }

    const body = await req.json();
    const { name, avatar, phoneNumber, country, nationalId } = body;

    if (!name) {
      return errorResponse("Name is required", 400);
    }

    // Handle avatar update cleanup
    if (avatar !== undefined && avatar !== user.avatar) {
      if (user.avatar) {
        try {
          await deleteImageFromCloudinary(user.avatar);
        } catch (error) {
          console.error("Failed to delete old avatar:", error);
        }
      }
      user.avatar = avatar;
    }

    user.name = name;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (country !== undefined) user.country = country;
    if (nationalId !== undefined) user.nationalId = nationalId;

    await user.save();

    return successResponse({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        phoneNumber: user.phoneNumber,
        country: user.country,
        nationalId: user.nationalId,
        profileCompleted: user.profileCompleted,
        hasPassword: user.hasPassword,
      },
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Update profile error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update profile";
    return errorResponse(message, 500);
  }
}
