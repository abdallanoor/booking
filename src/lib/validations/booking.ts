import { z } from "zod";

export const bookingSchema = z.object({
  propertyId: z.string().min(1, "Property ID is required"),
  checkIn: z.string().or(z.date()),
  checkOut: z.string().or(z.date()),
  guests: z.number().int().min(1, "At least 1 guest required"),
});

export type BookingInput = z.infer<typeof bookingSchema>;
