"use server";

import { revalidateTag, revalidatePath } from "next/cache";
import { apiGet, apiPost, apiPatch, apiDelete, apiPut } from "@/lib/api";
import type { Booking, ApiResponse, User } from "@/types";
import { uploadToCloudinary } from "@/lib/cloudinary";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function revalidateListings() {
  revalidateTag("listings", "max");
  revalidateTag("host-listings", "max");
  revalidatePath("/hosting/listings", "page");
  revalidatePath("/admin/listings", "page");
}

function revalidateBookings() {
  revalidateTag("bookings", "max");
  revalidatePath("/bookings", "page");
  revalidatePath("/hosting/bookings", "page");
  revalidatePath("/admin/bookings", "page");
}

function revalidateWishlist() {
  revalidateTag("wishlist", "max");
  revalidatePath("/wishlist", "page");
}

// ============================================================================
// LISTING ACTIONS
// ============================================================================

export async function createListingAction(data: unknown) {
  const result = await apiPost("/listings", data);
  revalidateListings();
  return result;
}

export async function updateListingAction(id: string, data: unknown) {
  const result = await apiPut(`/listings/${id}`, data);
  revalidateListings();
  revalidateTag(`listing-${id}`, "max");
  return result;
}

export async function updateListingStatusAction(
  id: string,
  status: "approved" | "rejected"
) {
  const result = await apiPatch(`/listings/${id}`, { status });
  revalidateListings();
  return result;
}

export async function deleteListingAction(id: string) {
  const result = await apiDelete(`/listings/${id}`);
  revalidateListings();
  return result;
}

// ============================================================================
// BOOKING ACTIONS
// ============================================================================

export async function createBookingAction(data: unknown) {
  const result = await apiPost("/bookings", data);
  revalidateBookings();
  return result;
}

export async function cancelBookingAction(id: string) {
  const result = await apiPatch(`/bookings/${id}`, { status: "cancelled" });
  revalidateBookings();
  revalidateTag(`booking-${id}`, "max");
  return result;
}

// ============================================================================
// WISHLIST ACTIONS
// ============================================================================

export async function addToWishlistAction(listingId: string) {
  const result = await apiPost("/wishlist", { listingId });
  revalidateWishlist();
  return result;
}

export async function removeFromWishlistAction(listingId: string) {
  const result = await apiDelete(`/wishlist/${listingId}`);
  revalidateWishlist();
  return result;
}

// ============================================================================
// HOSTING ACTIONS
// ============================================================================

export async function getAllBookingsAction() {
  return await apiGet<{ data: { bookings: Booking[] } }>(
    "/bookings?view=host",
    {
      cache: "no-store",
      tags: ["bookings"],
    }
  );
}

// ============================================================================
// AUTH ACTIONS
// ============================================================================

export async function updateUserAction(data: {
  name: string;
  avatar?: string;
}) {
  // SECURITY: Explicitly select only allowed fields to prevent Mass Assignment attacks.
  // This ensures that even if 'role' or other sensitive fields are injected into 'data',
  // they are stripped out before being sent to the API.
  const safePayload = {
    name: data.name,
    avatar: data.avatar,
  };

  const result = await apiPut<ApiResponse<{ user: User; message?: string }>>(
    "/auth/me",
    safePayload
  );
  revalidatePath("/", "layout");
  return result;
}

export async function logoutAction() {
  await apiPost("/auth/logout", {});
  revalidatePath("/", "layout");
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
