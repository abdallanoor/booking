import { getListingQuestions } from "@/services/questions.server";
import QuestionsDisplay from "./QuestionsDisplay";
import { Suspense } from "react";

interface QuestionListProps {
  listingId: string;
  hostId: string;
}

export default async function QuestionList({ listingId }: QuestionListProps) {
  const questions = await getListingQuestions(listingId);

  return (
    <Suspense fallback={<p>Loading...</p>}>
      <QuestionsDisplay questions={questions} listingId={listingId} />
    </Suspense>
  );
}
