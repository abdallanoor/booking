"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Send } from "lucide-react";

import { askQuestion } from "@/services/questions.service";
import { useTranslations } from "next-intl";

interface AskQuestionFormProps {
  listingId: string;
}

export default function AskQuestionForm({ listingId }: AskQuestionFormProps) {
  const [question, setQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { user } = useAuth();
  const t = useTranslations("guest_questions");

  if (!user) return null;

  if (isSubmitted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error(t("login_required"));
      return;
    }

    if (!question.trim()) {
      toast.error(t("empty_question"));
      return;
    }

    setIsSubmitting(true);

    try {
      await askQuestion(listingId, question);

      toast.success(t("success"));
      setQuestion("");
      setIsSubmitted(true);
    } catch (error) {
      console.error(error);
      toast.error(t("error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-start">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{t("ask_title")}</h3>
        <p className="text-sm text-muted-foreground">{t("ask_desc")}</p>
      </div>

      <Textarea
        placeholder={t("placeholder")}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        className="min-h-[100px] resize-none text-start"
        disabled={isSubmitting}
      />

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || !question.trim()}>
          {t("send")}{" "}
          {isSubmitting ? <Loader2 className="animate-spin" /> : <Send />}
        </Button>
      </div>
    </form>
  );
}
