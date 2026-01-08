import { Question } from "@/types";
import { MessageCircle } from "lucide-react";
import AskQuestionForm from "./AskQuestionForm";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface QuestionsDisplayProps {
  questions: Question[];
  listingId: string;
}

export default function QuestionsDisplay({ questions, listingId }: QuestionsDisplayProps) {
  return (
    <div className="pb-6" id="questions">
      <h2 className="text-2xl font-bold mb-6 text-foreground">Questions & Answers</h2>

      {questions.length > 0 ? (
        <Accordion type="single" collapsible className="w-full space-y-4">
          {questions.map((q) => (
            <AccordionItem
              key={q._id}
              value={q._id}
              className="border! border-border rounded-lg bg-muted/30 px-4"
            >
              <AccordionTrigger className="hover:no-underline py-4">
                <span className="font-medium text-foreground text-left">{q.question}</span>
              </AccordionTrigger>
              <AccordionContent className="pb-4 pt-1 text-muted-foreground whitespace-pre-wrap break-words">
                {q.answer || <span className="italic">No answer yet.</span>}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div className="text-center py-10 bg-muted/30 rounded-xl border border-dashed border-border">
          <MessageCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-medium text-foreground">
            No questions yet
          </h3>
          <p className="text-muted-foreground">
            Be the first to ask a question about this listing!
          </p>
        </div>
      )}

      <AskQuestionForm listingId={listingId} />
    </div>
  );
}
