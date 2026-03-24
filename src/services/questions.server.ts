import { apiGet } from "@/lib/api";
import type { Question } from "@/types";

/**
 * Server-only service for questions
 * Uses apiGet which handles server-side cookies and full URLs
 */
export async function getListingQuestions(
  listingId: string,
  locale?: string
): Promise<{ questions: Question[]; hasAskedQuestion: boolean }> {
  const headers: Record<string, string> = {};
  if (locale) headers["accept-language"] = locale;

  // Use the public API endpoint for getting visible questions for a listing
  const response = await apiGet<{
    questions: Question[];
    hasAskedQuestion: boolean;
  }>(`/listings/${listingId}/questions`, { headers });

  return response;
}

/**
 * Server-only service for host questions
 */
export async function getHostListingQuestions(
  listingId: string,
  locale?: string
): Promise<Question[]> {
  const headers: Record<string, string> = {};
  if (locale) headers["accept-language"] = locale;

  const response = await apiGet<Question[]>(
    `/host/listings/${listingId}/questions`,
    { headers }
  );
  return response;
}
