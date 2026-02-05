import { z } from "zod";

export const listingSchema = z.object({
  title: z.string({ message: "Title is required" }).min(3, "Title must be at least 3 characters"),
  description: z.string({ message: "Description is required" }).min(10, "Description must be at least 10 characters"),
  listingType: z.string({ message: "Listing type is required" }).min(1, "Listing type is required"),
  location: z.object({
    streetAddress: z.string({ message: "Street address is required" }).min(1, "Street address is required"),
    apt: z.string().optional(),
    city: z.string({ message: "City is required" }).min(1, "City is required"),
    governorate: z.string().optional(),
    country: z.string({ message: "Country is required" }).min(1, "Country is required"),
    postalCode: z.string().optional(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }),
    placeId: z.string().optional(),
    formattedAddress: z.string().optional(),
  }, { message: "Location is required" }),
  images: z.array(z.string()).min(1, "At least one image is required").max(10, "Maximum 10 images allowed"),
  amenities: z.array(z.string()).default([]),
  policies: z.array(z.string()).default([]),
  pricePerNight: z.number({ message: "Price is required" }).min(1, "Price must be at least EGP 1"),
  maxGuests: z.number({ message: "Max guests is required" }).int().min(1, "At least 1 guest required").max(50, "Max 50 guests allowed"),
  bedrooms: z.number({ message: "Bedrooms is required" }).int().min(0, "Bedrooms cannot be negative").max(50, "Max 50 bedrooms allowed"),
  beds: z.number({ message: "Beds is required" }).int().min(1, "At least 1 bed required").max(50, "Max 50 beds allowed"),
  bathrooms: z.number({ message: "Bathrooms is required" }).min(0.5, "Bathrooms cannot be less than 0.5").max(50, "Max 50 bathrooms allowed"),
  privacyType: z.enum(["entire_place", "private_room", "shared_room"], {
    message: "Invalid privacy type",
  }),
});

export type ListingInput = z.infer<typeof listingSchema>;
