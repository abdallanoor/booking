// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "Guest" | "Host" | "Admin";
  avatar?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// PROPERTY TYPES
// ============================================================================

export interface Property {
  _id: string;
  title: string;
  description: string;
  propertyType: string;
  location: {
    address: string;
    city: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  images: string[];
  amenities: string[];
  pricePerNight: number;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  rooms: number;
  privacyType: "entire_place" | "private_room" | "shared_room";
  status?: "pending" | "approved" | "rejected";
  host: {
    _id: string;
    name: string;
    avatar?: string;
    createdAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PropertyFilters {
  city?: string;
  country?: string;
  minPrice?: number;
  maxPrice?: number;
  guests?: number;
  hostId?: string;
}

// ============================================================================
// BOOKING TYPES
// ============================================================================

export interface Booking {
  _id: string;
  property: {
    _id: string;
    title: string;
    images: string[];
    location: {
      city: string;
      country: string;
    };
  };
  guest: {
    _id: string;
    name: string;
    email: string;
  };
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
}

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

export interface DashboardStats {
  totalProperties: number;
  totalBookings: number;
  totalRevenue: number;
  pendingProperties?: number;
  recentBookings?: Booking[];
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  error?: string;
}
