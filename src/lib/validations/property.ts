import { z } from "zod";

export const propertySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  propertyType: z.string().min(1, "Property type is required"),
  location: z.object({
    address: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    country: z.string().min(1, "Country is required"),
    coordinates: z
      .object({
        lat: z.number(),
        lng: z.number(),
      })
      .optional(),
  }),
  images: z.array(z.string()).min(1, "At least one image is required"),
  amenities: z.array(z.string()).default([]),
  pricePerNight: z.number().min(1, "Price must be at least $1"),
  maxGuests: z.number().int().min(1, "At least 1 guest required"),
  bedrooms: z.number().int().min(0, "Bedrooms cannot be negative"),
  beds: z.number().int().min(1, "At least 1 bed required"),
  bathrooms: z.number().min(0.5, "Bathrooms cannot be less than 0.5"),
  rooms: z.number().int().min(1, "At least 1 room required"),
  privacyType: z.enum(["entire_place", "private_room", "shared_room"], {
    message: "Invalid privacy type",
  }),
});

export type PropertyInput = z.infer<typeof propertySchema>;
