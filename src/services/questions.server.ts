import { apiGet } from "@/lib/api";
import type { Question } from "@/types";

/**
 * Server-only service for questions
 * Uses apiGet which handles server-side cookies and full URLs
 */
export async function getListingQuestions(
  listingId: string
): Promise<Question[]> {
  // Use the public API endpoint for getting visible questions for a listing
  const response = await apiGet<Question[]>(
    `/listings/${listingId}/questions`,
    {
      revalidate: 0, // No cache for now to see immediate updates
      tags: [`questions-${listingId}`],
    }
  );

  return response;
}

/**
 * Server-only service for host questions
 */
export async function getHostListingQuestions(
  listingId: string
): Promise<Question[]> {
  const response = await apiGet<Question[]>(
    `/host/listings/${listingId}/questions`,
    {
      revalidate: 0,
      tags: [`host-questions-${listingId}`],
    }
  );
  return response;
}
