"use server";

import { revalidateTag, revalidatePath } from "next/cache";
import { apiGet, apiPost, apiPatch, apiDelete, apiPut } from "@/lib/api";
import type {
  Property,
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

function revalidateProperties() {
  revalidateTag("properties", "max");
  revalidateTag("host-properties", "max");
  revalidatePath("/dashboard/properties", "page");
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
// PROPERTY ACTIONS
// ============================================================================

export async function getPropertiesAction() {
  return await apiGet<{ data: { properties: Property[] } }>(
    "/properties?dashboard=true",
    {
      cache: "no-store",
      tags: ["properties"],
    }
  );
}

export async function createPropertyAction(data: unknown) {
  const result = await apiPost("/properties", data);
  revalidateProperties();
  return result;
}

export async function updatePropertyAction(id: string, data: unknown) {
  const result = await apiPut(`/properties/${id}`, data);
  revalidateProperties();
  revalidateTag(`property-${id}`, "max");
  return result;
}

export async function updatePropertyStatusAction(
  id: string,
  status: "approved" | "rejected"
) {
  const result = await apiPatch(`/properties/${id}`, { status });
  revalidateProperties();
  return result;
}

export async function deletePropertyAction(id: string) {
  const result = await apiDelete(`/properties/${id}`);
  revalidateProperties();
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

export async function addToWishlistAction(propertyId: string) {
  const result = await apiPost("/wishlist", { propertyId });
  revalidateWishlist();
  return result;
}

export async function removeFromWishlistAction(propertyId: string) {
  const result = await apiDelete(`/wishlist/${propertyId}`);
  revalidateWishlist();
  return result;
}

// ============================================================================
// DASHBOARD ACTIONS
// ============================================================================

export async function getDashboardStatsAction(): Promise<DashboardStats> {
  // Parallel fetch for optimized dashboard loading
  const [propertiesRes, bookingsRes] = await Promise.all([
    apiGet<{ data: { properties: Property[] } }>("/properties?dashboard=true", {
      revalidate: 0,
      tags: ["properties"],
    }),
    apiGet<{ data: { bookings: Booking[] } }>("/bookings?view=host", {
      revalidate: 0,
      tags: ["bookings"],
    }),
  ]);

  const properties = propertiesRes.data.properties;
  const bookings = bookingsRes.data.bookings;

  // Calculate stats
  const totalProperties = properties.length;
  const totalBookings = bookings.length;
  const totalRevenue = bookings
    .filter((b) => b.status === "confirmed")
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const pendingProperties = properties.filter(
    (p) => p.status === "pending"
  ).length;

  // Get recent bookings (last 5)
  // detailed check to avoid "cannot read properties of null" on frontend
  const recentBookings = [...bookings]
    .filter((b) => b && b.property && b.guest && b.property._id && b.guest._id)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  return {
    totalProperties,
    totalBookings,
    totalRevenue,
    pendingProperties,
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
