import { type LucideIcon } from "lucide-react";
import type { Document, Types } from "mongoose";

// ============================================================================
// SHARED TYPES & ENUMS
// ============================================================================

export type UserRole = "Guest" | "Host" | "Admin";
export type ListingStatus = "pending" | "approved" | "rejected";
export type PrivacyType = "entire_place" | "private_room" | "shared_room";
export type BookingStatus = "pending_payment" | "confirmed" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type AuthProvider = "local" | "google";
export type Section = "guest" | "hosting" | "admin";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Location {
  address: string;
  city: string;
  country: string;
  coordinates?: Coordinates;
}

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

/**
 * Base User structure shared across DB and API
 */
export interface UserBase {
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  emailVerified: boolean;
  provider: AuthProvider;
  googleId?: string;
  phoneNumber?: string;
  country?: string;
  nationalId?: string;
  creditCard?: CreditCard;
  bankDetails?: BankDetails;
  profileCompleted: boolean;
  isBlocked: boolean;
  hasPassword?: boolean;
}

/**
 * User as returned by the API (Serialized)
 */
export interface User extends UserBase {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * User for auth responses (with 'id' instead of '_id')
 */
export interface AuthUser extends Omit<User, "_id"> {
  id: string;
}

export interface AuthResponse {
  user: AuthUser;
}

export interface HeaderUser {
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface Host {
  _id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  avatar?: string;
  createdAt?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

// ============================================================================
// LISTING TYPES
// ============================================================================

/**
 * Base Listing structure
 */
export interface ListingBase {
  title: string;
  description: string;
  listingType: string;
  location: Location;
  images: string[];
  amenities: string[];
  policies: string[];
  pricePerNight: number;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  rooms: number;
  privacyType: PrivacyType;
  status: ListingStatus;
}

/**
 * Listing as returned by the API
 */
export interface Listing extends ListingBase {
  _id: string;
  host: Host; // Populated in API
  reviews?: Review[]; // Optional reviews array
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

/**
 * Base Booking structure
 */
export interface BookingBase {
  checkIn: string | Date;
  checkOut: string | Date;
  guests: number;
  totalPrice: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentId?: string;
}

/**
 * Booking as returned by the API
 */
export interface Booking extends Omit<BookingBase, "checkIn" | "checkOut"> {
  _id: string;
  checkIn: string;
  checkOut: string;
  listing: {
    _id: string;
    title: string;
    images: string[];
    location: Pick<Location, "city" | "country">;
  };
  guest: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  reviewEmailSent?: boolean;
  reviewId?: string;
  createdAt: string;
}

// ============================================================================
// REVIEW TYPES
// ============================================================================

/**
 * Base Review structure
 */
export interface ReviewBase {
  listing: string;
  guest: string;
  booking: string;
  rating: number;
  comment?: string;
}

/**
 * Review as returned by the API
 */
export interface Review
  extends Omit<ReviewBase, "listing" | "guest" | "booking"> {
  _id: string;
  listing: {
    _id: string;
    title: string;
  };
  guest: {
    _id: string;
    name: string;
    avatar?: string;
  };
  booking: {
    _id: string;
    checkIn: string;
    checkOut: string;
  };
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewEligibilityResponse {
  eligible: boolean;
  reason?: string;
  message?: string;
  booking?: {
    _id: string;
    checkIn: string;
    checkOut: string;
    hoursSinceCheckout?: number;
  };
  bookings?: Array<{
    _id: string;
    checkIn: string;
    checkOut: string;
    hoursSinceCheckout?: number;
  }>; // Keep for backward compatibility
}

export interface CreateReviewInput {
  listingId: string;
  bookingId?: string; // Optional - backend will auto-select
  rating: number;
  comment?: string;
}

export interface UpdateReviewInput {
  rating?: number;
  comment?: string;
}

// ============================================================================
// QUESTION TYPES
// ============================================================================

export interface QuestionBase {
  question: string;
  answer?: string;
  isVisible: boolean;
  isFAQ: boolean;
}

export interface Question extends QuestionBase {
  _id: string;
  listingId: string;
  guestId?: string; // Populated or just ID
  hostId: string;
  guest?: {
    _id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// PAYMENT TYPES
// ============================================================================

/**
 * Base Payment structure
 */
export interface PaymentBase {
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymobIntentionId: string;
  paymobTransactionId?: string;
  paymobOrderId?: string;
  paymentMethod?: string;
  cardLastFour?: string;
  cardBrand?: string;
  errorMessage?: string;
  paidAt?: string | Date;
}

/**
 * Payment as returned by the API
 */
export interface Payment extends Omit<PaymentBase, "paidAt"> {
  _id: string;
  booking: string;
  guest: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentDetails extends Omit<Payment, "booking"> {
  booking?: {
    _id: string;
    listing?: {
      title: string;
      images: string[];
      location: Pick<Location, "city" | "country">;
    };
    checkIn: string;
    checkOut: string;
    totalPrice: number;
    status: string;
  };
}

// ============================================================================
// PAYMOB API TYPES
// ============================================================================

export interface PaymobBillingData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  country: string;
  state?: string;
  city?: string;
  street?: string;
  building?: string;
  floor?: string;
  apartment?: string;
  postal_code?: string;
}

export interface PaymobIntentionItem {
  name: string;
  amount: number; // Amount in piasters
  description?: string;
  quantity: number;
}

export interface CreateIntentionRequest {
  amount: number; // Total amount in piasters
  currency: string;
  payment_methods: number[];
  billing_data: PaymobBillingData;
  items: PaymobIntentionItem[];
  special_reference?: string;
  notification_url?: string;
  redirection_url?: string;
  extras?: Record<string, string>;
}

export interface PaymobIntentionResponse {
  id?: string;
  intention_id: string;
  client_secret: string;
  intention_detail: {
    amount: number;
    currency: string;
    items: PaymobIntentionItem[];
  };
  payment_keys: Array<{
    integration: number;
    key: string;
  }>;
}

export interface PaymobTransactionData {
  id: number;
  pending: boolean;
  amount_cents: number;
  success: boolean;
  is_auth: boolean;
  is_capture: boolean;
  is_standalone_payment: boolean;
  is_voided: boolean;
  is_refunded: boolean;
  is_3d_secure: boolean;
  integration_id: number;
  has_parent_transaction: boolean;
  order: {
    id: number;
    created_at: string;
    merchant_order_id?: string;
    amount_cents: number;
    currency: string;
  };
  created_at: string;
  currency: string;
  source_data: {
    type: string;
    pan?: string;
    sub_type?: string;
  };
  error_occured: boolean;
  owner: number;
  data: {
    message?: string;
    gateway_integration_pk?: number;
    klass?: string;
    txn_response_code?: string;
  };
}

export interface PaymobWebhookPayload {
  type: string;
  obj: PaymobTransactionData;
  hmac: string;
}

export interface ParsedPaymentResult {
  success: boolean;
  transactionId: string;
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  errorMessage?: string;
  specialReference?: string;
  isPending: boolean;
  isRefunded: boolean;
  isVoided: boolean;
}

export interface InitiatePaymentParams {
  bookingId: string;
  listingId: string;
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  listingTitle: string;
}

export interface InitiatePaymentResult {
  checkoutUrl: string;
  paymentId: string;
  intentionId: string;
}

export interface PaymobAuthResponse {
  token: string;
  profile: unknown;
}

export interface PaymobRefundResponse {
  id: number;
  amount_cents: number;
  success: boolean;
  is_refunded: boolean;
  order: number;
  created_at: string;
  transaction: number;
}

// ============================================================================
// SERVICE & STATS TYPES
// ============================================================================

export interface AdminStats {
  totalUsers: number;
  activeListings: number;
  pendingListings: number;
  totalBookings: number;
  revenue: number;
}

export interface HostingStats {
  activeListings: number;
  pendingBookings: number;
  upcomingGuests: number;
  totalEarnings: number;
}

export interface WishlistItem {
  _id: string;
  user: string;
  listing: Listing;
  createdAt: string;
}

export interface SearchFilters {
  location?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
}

// ============================================================================
// UI & CONTEXT TYPES
// ============================================================================

export interface BottomNavLink {
  href: string;
  label: string;
  icon: LucideIcon;
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

// ============================================================================
// DATABASE / MONGOOSE TYPES
// ============================================================================

/**
 * Mongoose User Document
 */
export interface IUserDocument extends Document, Omit<UserBase, "hasPassword"> {
  password?: string;
  hasPassword?: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  checkProfileCompletion(action: "book" | "withdraw"): boolean;
}

/**
 * Mongoose Listing Document
 */
export interface IListingDocument
  extends Document,
    Omit<ListingBase, "status"> {
  status: ListingStatus;
  host: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose Booking Document
 */
export interface IBookingDocument
  extends Document,
    Omit<BookingBase, "checkIn" | "checkOut" | "paymentId"> {
  listing: Types.ObjectId;
  guest: Types.ObjectId;
  checkIn: Date;
  checkOut: Date;
  paymentId?: Types.ObjectId;
  reviewEmailSent?: boolean;
  reviewId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose Review Document
 */
export interface IReviewDocument
  extends Document,
    Omit<ReviewBase, "listing" | "guest" | "booking"> {
  listing: Types.ObjectId;
  guest: Types.ObjectId;
  booking: Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose Payment Document
 */
export interface IPaymentDocument
  extends Document,
    Omit<PaymentBase, "paidAt"> {
  booking: Types.ObjectId;
  guest: Types.ObjectId;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose Wishlist Document
 */
export interface IWishlistDocument extends Document {
  user: Types.ObjectId;
  listing: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose Question Document
 */
export interface IQuestionDocument extends Document, QuestionBase {
  listingId: Types.ObjectId;
  guestId?: Types.ObjectId;
  hostId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
