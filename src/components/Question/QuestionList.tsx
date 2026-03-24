import { getListingQuestions } from "@/services/questions.server";
import QuestionsDisplay from "./QuestionsDisplay";
import { Suspense } from "react";
import { getLocale } from "next-intl/server";

interface QuestionListProps {
  listingId: string;
  hostId: string;
}

export default async function QuestionList({ listingId }: QuestionListProps) {
  const locale = await getLocale();
  const { questions, hasAskedQuestion } = await getListingQuestions(listingId, locale);

  return (
    <Suspense fallback={null}>
      <QuestionsDisplay
        questions={questions}
        listingId={listingId}
        hasAskedQuestion={hasAskedQuestion}
      />
    </Suspense>
  );
}
