import { z } from "zod";

export const bookingSchema = z.object({
  listingId: z.string().min(1, "Listing ID is required"),
  checkIn: z.string().or(z.date()),
  checkOut: z.string().or(z.date()),
  guests: z.number().int().min(1, "At least 1 guest required"),
});

export type BookingInput = z.infer<typeof bookingSchema>;
