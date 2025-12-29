// ============================================================================
// USER TYPES
// ============================================================================

export interface CreditCard {
  lastFour?: string;
  token?: string;
  provider?: string;
}

export interface BankDetails {
  bankName?: string;
  accountNumber?: string;
  routingNumber?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "Guest" | "Host" | "Admin";
  avatar?: string;
  emailVerified: boolean;
  password?: string;
  provider: "local" | "google";
  googleId?: string;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: string;
  isBlocked: boolean;
  phoneNumber?: string;
  country?: string;
  nationalId?: string;
  creditCard?: CreditCard;
  bankDetails?: BankDetails;
  profileCompleted: boolean;
  hasPassword?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// LISTING TYPES
// ============================================================================

export interface Listing {
  _id: string;
  title: string;
  description: string;
  listingType: string;
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

export interface ListingFilters {
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
  listing: {
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
    avatar?: string;
  };
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
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
