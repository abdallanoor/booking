"use server";

import { revalidateTag, revalidatePath } from "next/cache";
import { apiGet, apiPost, apiPatch, apiDelete, apiPut } from "@/lib/api";
import type {
  Listing,
  Booking,
  DashboardStats,
  ApiResponse,
  User,
} from "@/types";
import { uploadToCloudinary } from "@/lib/cloudinary";

// Re-export DashboardStats for convenience
export type { DashboardStats };

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function revalidateListings() {
  revalidateTag("listings", "max");
  revalidateTag("host-listings", "max");
  revalidatePath("/dashboard/listings", "page");
}

function revalidateBookings() {
  revalidateTag("bookings", "max");
  revalidatePath("/bookings", "page");
  revalidatePath("/dashboard/bookings", "page");
}

function revalidateWishlist() {
  revalidateTag("wishlist", "max");
  revalidatePath("/wishlist", "page");
}

// ============================================================================
// LISTING ACTIONS
// ============================================================================

export async function getListingsAction() {
  return await apiGet<{ data: { listings: Listing[] } }>(
    "/listings?dashboard=true",
    {
      cache: "no-store",
      tags: ["listings"],
    }
  );
}

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
// DASHBOARD ACTIONS
// ============================================================================

export async function getDashboardStatsAction(): Promise<DashboardStats> {
  // Parallel fetch for optimized dashboard loading
  const [listingsRes, bookingsRes] = await Promise.all([
    apiGet<{ data: { listings: Listing[] } }>("/listings?dashboard=true", {
      revalidate: 0,
      tags: ["listings"],
    }),
    apiGet<{ data: { bookings: Booking[] } }>("/bookings?view=host", {
      revalidate: 0,
      tags: ["bookings"],
    }),
  ]);

  const listings = listingsRes.data.listings;
  const bookings = bookingsRes.data.bookings;

  // Calculate stats
  const totalListings = listings.length;
  const totalBookings = bookings.length;
  const totalRevenue = bookings
    .filter((b) => b.status === "confirmed")
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const pendingListings = listings.filter((p) => p.status === "pending").length;

  // Get recent bookings (last 5)
  // detailed check to avoid "cannot read listings of null" on frontend
  const recentBookings = [...bookings]
    .filter((b) => b && b.listing && b.guest && b.listing._id && b.guest._id)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  return {
    totalListings,
    totalBookings,
    totalRevenue,
    pendingListings,
    recentBookings,
  };
}

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
