import { apiClient } from "@/lib/api-client";
import { Question } from "@/types";

// Guest APIs
export async function getListingQuestions(
  listingId: string
): Promise<Question[]> {
  return apiClient.get<Question[]>(`/listings/${listingId}/questions`);
}

export async function askQuestion(
  listingId: string,
  question: string
): Promise<Question> {
  return apiClient.post<Question>(`/listings/${listingId}/questions`, {
    question,
  });
}

// Host APIs
export async function getHostListingQuestions(
  listingId: string
): Promise<Question[]> {
  return apiClient.get<Question[]>(`/host/listings/${listingId}/questions`);
}

export async function createFAQ(
  listingId: string,
  data: { question: string; answer: string }
): Promise<Question> {
  return apiClient.post<Question>(
    `/host/listings/${listingId}/questions`,
    data
  );
}

export async function updateQuestion(
  questionId: string,
  data: { answer?: string; isVisible?: boolean }
): Promise<Question> {
  return apiClient.patch<Question>(`/host/questions/${questionId}`, data);
}

export async function deleteQuestion(
  questionId: string
): Promise<{ message: string }> {
  return apiClient.delete<{ message: string }>(`/host/questions/${questionId}`);
}
