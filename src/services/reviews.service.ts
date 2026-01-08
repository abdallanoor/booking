import { clientGet, clientPost, clientPut, clientDelete } from "@/lib/api-client";
import type { Review, ReviewEligibilityResponse, CreateReviewInput, UpdateReviewInput } from "@/types";

// Get reviews for a listing
export async function getReviews(listingId: string): Promise<Review[]> {
  const response = await clientGet<{ data: { reviews: Review[] } }>(
    `/reviews?listingId=${listingId}`
  );

  return response.data.reviews;
}

// Check if user is eligible to review a listing
export async function checkEligibility(
  listingId: string
): Promise<ReviewEligibilityResponse> {
  const response = await clientGet<{ data: ReviewEligibilityResponse }>(
    `/reviews/check-eligibility?listingId=${listingId}`
  );

  return response.data;
}

// Create a new review
export async function createReview(
  data: CreateReviewInput
): Promise<{ review: Review }> {
  const response = await clientPost<{ data: { review: Review } }>(
    "/reviews",
    data
  );

  return response.data;
}

// Update an existing review
export async function updateReview(
  reviewId: string,
  data: UpdateReviewInput
): Promise<{ review: Review }> {
  const response = await clientPut<{ data: { review: Review } }>(
    `/reviews/${reviewId}`,
    data
  );

  return response.data;
}

// Delete a review
export async function deleteReview(reviewId: string): Promise<void> {
  await clientDelete(`/reviews/${reviewId}`);
}

