"use server";

import { apiGet, apiPost, apiPatch, apiDelete, apiPut } from "@/lib/api";
import type { Booking, ApiResponse, User } from "@/types";
import { uploadToCloudinary } from "@/lib/cloudinary";

// ============================================================================
// BOOKING ACTIONS
// ============================================================================

export async function createBookingAction(data: unknown) {
  const result = await apiPost<{ data: { booking: Booking } }>(
    "/bookings",
    data,
  );

  // Return the booking object for payment initiation
  if (result.data?.booking) {
    return result.data.booking;
  }

  throw new Error("Failed to create booking");
}

export async function cancelBookingAction(id: string) {
  const result = await apiPatch(`/bookings/${id}`, { status: "cancelled" });
  return result;
}

// ============================================================================
// WISHLIST ACTIONS
// ============================================================================

export async function addToWishlistAction(listingId: string) {
  const result = await apiPost("/wishlist", { listingId });
  return result;
}

export async function removeFromWishlistAction(listingId: string) {
  const result = await apiDelete(`/wishlist/${listingId}`);
  return result;
}

// ============================================================================
// HOSTING ACTIONS
// ============================================================================

export async function getAllBookingsAction() {
  return await apiGet<{ data: { bookings: Booking[] } }>("/bookings?view=host");
}

// ============================================================================
// AUTH ACTIONS
// ============================================================================

export async function updateUserAction(data: {
  name: string;
  avatar?: string;
  phoneNumber?: string;
  country?: string;
  nationalId?: string;
}) {
  // SECURITY: Explicitly select only allowed fields to prevent Mass Assignment attacks.
  // This ensures that even if 'role' or other sensitive fields are injected into 'data',
  // they are stripped out before being sent to the API.
  const safePayload = {
    name: data.name,
    avatar: data.avatar,
    phoneNumber: data.phoneNumber,
    country: data.country,
    nationalId: data.nationalId,
  };

  const result = await apiPut<ApiResponse<{ user: User; message?: string }>>(
    "/auth/me",
    safePayload,
  );
  return result;
}

export async function logoutAction() {
  await apiPost("/auth/logout", {});
}

export async function uploadAvatarAction(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) {
    return { success: false, message: "No file provided" };
  }

  try {
    const imageUrl = await uploadToCloudinary(file);
    return { success: true, url: imageUrl };
  } catch (error) {
    console.error("Avatar upload failed:", error);
    return { success: false, message: "Failed to upload avatar" };
  }
}

export async function uploadListingImagesAction(formData: FormData) {
  const files = formData.getAll("files") as File[];
  if (!files || files.length === 0) {
    return { success: false, message: "No files provided" };
  }

  try {
    const uploadPromises = files.map((file) => uploadToCloudinary(file));
    const urls = await Promise.all(uploadPromises);
    return { success: true, urls };
  } catch (error) {
    console.error("Listing images upload failed:", error);
    return { success: false, message: "Failed to upload images" };
  }
}

export async function changePasswordAction(
  currentPassword?: string,
  newPassword?: string,
) {
  try {
    const result = await apiPatch<ApiResponse<{ message: string }>>(
      "/auth/update-password",
      {
        currentPassword,
        newPassword,
      },
    );
    return result;
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to change password",
      data: { message: "" },
    };
  }
}
