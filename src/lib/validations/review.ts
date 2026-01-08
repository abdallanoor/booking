import { z } from "zod";

export const reviewSchema = z.object({
  listingId: z.string().min(1, "Listing ID is required"),
  bookingId: z.string().optional(), // Optional - backend will auto-select the most recent eligible booking
  rating: z
    .number()
    .int("Rating must be an integer")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  comment: z
    .string()
    .max(2000, "Comment cannot exceed 2000 characters")
    .optional(),
});

export const updateReviewSchema = z.object({
  rating: z
    .number()
    .int("Rating must be an integer")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5")
    .optional(),
  comment: z
    .string()
    .max(2000, "Comment cannot exceed 2000 characters")
    .optional(),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
