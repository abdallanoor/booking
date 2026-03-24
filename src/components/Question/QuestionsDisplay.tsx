"use client";

import { useState } from "react";
import { Question } from "@/types";
import { MessageCircle } from "lucide-react";
import AskQuestionForm from "./AskQuestionForm";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface QuestionsDisplayProps {
  questions: Question[];
  listingId: string;
  hasAskedQuestion: boolean;
}

// Component must be declared outside of render
const QuestionAccordion = ({
  questionsList,
  t,
}: {
  questionsList: Question[];
  t: any;
}) => (
  <Accordion
    type="single"
    collapsible
    className="w-full space-y-4"
    suppressHydrationWarning
  >
    {questionsList.map((q) => (
      <AccordionItem
        key={q._id}
        value={q._id}
        className="border! border-border rounded-2xl bg-muted/30 px-4"
        suppressHydrationWarning
      >
        <AccordionTrigger
          className="hover:no-underline py-4"
          suppressHydrationWarning
        >
          <span className="font-medium text-foreground text-left">
            {q.question}
          </span>
        </AccordionTrigger>
        <AccordionContent
          className="pb-4 pt-1 text-muted-foreground whitespace-pre-wrap wrap-break-word text-start"
          suppressHydrationWarning
        >
          {q.answer || <span className="italic">{t("no_answer")}</span>}
        </AccordionContent>
      </AccordionItem>
    ))}
  </Accordion>
);

export default function QuestionsDisplay({
  questions,
  listingId,
  hasAskedQuestion,
}: QuestionsDisplayProps) {
  const t = useTranslations("guest_questions");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const MAX_VISIBLE_QUESTIONS = 4;
  const hasMoreQuestions = questions.length > MAX_VISIBLE_QUESTIONS;
  const visibleQuestions = hasMoreQuestions
    ? questions.slice(0, MAX_VISIBLE_QUESTIONS)
    : questions;

  return (
    <div className="pb-6 text-start" id="questions">
      <h2 className="text-2xl font-bold mb-6 text-foreground">{t("title")}</h2>

      {questions.length > 0 ? (
        <div>
          {/* Show first 4 questions */}
          <QuestionAccordion questionsList={visibleQuestions} t={t} />

          {/* View More Button if more than 4 questions */}
          {hasMoreQuestions && (
            <div className="mt-6 text-center">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild suppressHydrationWarning>
                  <Button variant="secondary" className="sm:w-auto">
                    {t("show_all", { count: questions.length })}
                  </Button>
                </DialogTrigger>
                <DialogContent
                  variant="drawer"
                  className="md:max-w-lg! max-h-[85vh] flex flex-col"
                  suppressHydrationWarning
                >
                  <DialogHeader className="text-start">
                    <DialogTitle>
                      {t("all_questions", { count: questions.length })}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="overflow-y-auto pe-2 -me-2 flex-1">
                    <QuestionAccordion questionsList={questions} t={t} />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-10 bg-muted/30 rounded-xl border border-dashed border-border">
          <MessageCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-medium text-foreground">
            {t("no_questions")}
          </h3>
          <p className="text-muted-foreground">{t("be_first")}</p>
        </div>
      )}

      {!hasAskedQuestion && <AskQuestionForm listingId={listingId} />}
    </div>
  );
}
