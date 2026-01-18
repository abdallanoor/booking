import { apiGet } from "@/lib/api";
import type { Question } from "@/types";

/**
 * Server-only service for questions
 * Uses apiGet which handles server-side cookies and full URLs
 */
export async function getListingQuestions(
  listingId: string
): Promise<{ questions: Question[]; hasAskedQuestion: boolean }> {
  // Use the public API endpoint for getting visible questions for a listing
  const response = await apiGet<{
    questions: Question[];
    hasAskedQuestion: boolean;
  }>(`/listings/${listingId}/questions`);

  return response;
}

/**
 * Server-only service for host questions
 */
export async function getHostListingQuestions(
  listingId: string
): Promise<Question[]> {
  const response = await apiGet<Question[]>(
    `/host/listings/${listingId}/questions`
  );
  return response;
}
