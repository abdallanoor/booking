"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Send } from "lucide-react";

import { askQuestion } from "@/services/questions.service";

interface AskQuestionFormProps {
  listingId: string;
}

export default function AskQuestionForm({
  listingId,
}: AskQuestionFormProps) {
  const [question, setQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { user } = useAuth();

  if (!user) return null;

  if (isSubmitted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in to ask a question");
      return;
    }

    if (!question.trim()) {
      toast.error("Please enter a question");
      return;
    }

    setIsSubmitting(true);

    try {
      await askQuestion(listingId, question);

      toast.success("Question submitted successfully!");
      setQuestion("");
      setIsSubmitted(true);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Ask a Question</h3>
        <p className="text-sm text-muted-foreground">
          Have questions about this listing? Ask the host directly.
        </p>
      </div>

      <Textarea
        placeholder="Type your question here..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        className="min-h-[100px] resize-none"
        disabled={isSubmitting}
      />

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting || !question.trim()}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" />
              Sending...
            </>
          ) : (
            <>
              Send Question
              <Send />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
