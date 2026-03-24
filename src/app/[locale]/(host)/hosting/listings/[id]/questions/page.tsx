"use client";

import { useState, useCallback, useEffect } from "react";
import { Question, Listing } from "@/types";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  Edit,
  Eye,
  EyeOff,
  MessageSquare,
  Trash2,
} from "lucide-react";
import {
  getHostListingQuestions,
  updateQuestion,
  createFAQ,
  deleteQuestion,
} from "@/services/questions.service";
import { useRouter, useParams } from "next/navigation";
import { Link } from "@/navigation";
import { useTranslations, useLocale } from "next-intl";

export default function HostQuestionsPage() {
  const t = useTranslations("questions");
  const locale = useLocale();
  const params = useParams<{ id: string }>();
  const listingId = params.id;

  const [listingTitle, setListingTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingQuestionId, setUpdatingQuestionId] = useState<string | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  // FAQ State
  const [isFAQDialogOpen, setIsFAQDialogOpen] = useState(false);
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [listingRes, data] = await Promise.all([
        apiClient.get<{ data: { listing: Listing } }>(`/listings/${listingId}`, {
          headers: { "accept-language": locale },
        }),
        getHostListingQuestions(listingId, locale),
      ]);

      setListingTitle(listingRes.data.listing.title);
      setQuestions(data);
    } catch (error) {
      console.error("Error loading questions page:", error);
      toast.error(t("load_failed"));
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshQuestions = useCallback(async () => {
    try {
      const data = await getHostListingQuestions(listingId, locale);
      setQuestions(data);
    } catch (error) {
      console.error("Error refreshing questions:", error);
      toast.error(t("refresh_failed"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  const handleToggleVisibility = async (
    id: string,
    currentVisibility: boolean,
  ) => {
    try {
      setUpdatingQuestionId(id);
      await updateQuestion(id, { isVisible: !currentVisibility });
      setQuestions((prev) =>
        prev.map((q) =>
          q._id === id ? { ...q, isVisible: !currentVisibility } : q,
        ),
      );
      toast.success(t("visibility_updated"));
    } catch (error) {
      console.error(error);
      toast.error(t("visibility_failed"));
    } finally {
      setUpdatingQuestionId(null);
    }
  };

  const handleSubmitAnswer = async (id: string) => {
    if (!answerText.trim()) return;
    setIsSubmitting(true);
    try {
      await updateQuestion(id, { answer: answerText });
      toast.success(t("answer_submitted"));
      setAnsweringId(null);
      setAnswerText("");
      await refreshQuestions();
    } catch (error) {
      console.error(error);
      toast.error(t("answer_failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateFAQ = async () => {
    if (!faqQuestion.trim() || !faqAnswer.trim()) {
      toast.error(t("faq_required"));
      return;
    }
    setIsSubmitting(true);
    try {
      await createFAQ(listingId, {
        question: faqQuestion,
        answer: faqAnswer,
      });
      toast.success(t("faq_created"));
      setIsFAQDialogOpen(false);
      setFaqQuestion("");
      setFaqAnswer("");
      await refreshQuestions();
    } catch (error) {
      console.error(error);
      toast.error(t("faq_failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteQuestion(id);
      setQuestions((prev) => prev.filter((q) => q._id !== id));
      toast.success(t("deleted"));
    } catch (error) {
      console.error(error);
      toast.error(t("delete_failed"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <Link href="/hosting/listings" className="order-1">
          <Button variant="secondary" size="icon" className="rounded-full">
            <ChevronLeft className="rtl:rotate-180" />
          </Button>
        </Link>
        <div className="order-3 md:order-2 w-full md:w-auto md:flex-1">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-72" />
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold">{t("title")}</h1>
              <p className="text-muted-foreground">
                {t("desc")}{" "}
                <span className="font-semibold">{listingTitle}</span>
              </p>
            </>
          )}
        </div>
        {!isLoading && (
          <Dialog open={isFAQDialogOpen} onOpenChange={setIsFAQDialogOpen}>
            <DialogTrigger asChild>
              <Button className="order-2 md:order-3">{t("add_faq")}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("faq_dialog_title")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("faq_question_label")}</Label>
                  <Input
                    value={faqQuestion}
                    onChange={(e) => setFaqQuestion(e.target.value)}
                    placeholder={t("faq_question_placeholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("faq_answer_label")}</Label>
                  <Textarea
                    value={faqAnswer}
                    onChange={(e) => setFaqAnswer(e.target.value)}
                    placeholder={t("faq_answer_placeholder")}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateFAQ} disabled={isSubmitting}>
                  {isSubmitting ? t("saving") : t("save_faq")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsFAQDialogOpen(false)}
                >
                  {t("cancel")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="rounded-2xl border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[300px]">{t("col_question")}</TableHead>
              <TableHead>{t("col_type")}</TableHead>
              <TableHead>{t("col_status")}</TableHead>
              <TableHead>{t("col_asked")}</TableHead>
              <TableHead>{t("col_visibility")}</TableHead>
              <TableHead className="text-end">{t("col_actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="align-top">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-4/5" />
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </TableCell>
                  <TableCell className="align-top">
                    <Skeleton className="h-5 w-18 rounded-full" />
                  </TableCell>
                  <TableCell className="align-top">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="align-top">
                    <Skeleton className="h-5 w-10 rounded-full" />
                  </TableCell>
                  <TableCell className="align-top text-end">
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : questions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  {t("no_questions")}
                </TableCell>
              </TableRow>
            ) : (
              questions.map((q) => (
                <TableRow key={q._id}>
                  <TableCell className="align-top max-w-[300px]">
                    <p className="font-medium mb-1 truncate" title={q.question}>
                      {q.question}
                    </p>
                    {answeringId === q._id ? (
                      <div className="mt-2 space-y-2">
                        <Textarea
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          placeholder={t("answer_placeholder")}
                          className="resize-none"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSubmitAnswer(q._id)}
                            disabled={isSubmitting}
                          >
                            {t("submit")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setAnsweringId(null);
                              setAnswerText("");
                            }}
                          >
                            {t("cancel")}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      q.answer && (
                        <div
                          className="text-sm text-muted-foreground mt-1 line-clamp-2 wrap-break-word truncate"
                          title={q.answer}
                        >
                          {q.answer}
                        </div>
                      )
                    )}
                  </TableCell>
                  <TableCell className="align-top">
                    {q.isFAQ ? (
                      <Badge variant="secondary">{t("type_faq")}</Badge>
                    ) : (
                      <Badge variant="outline">{t("type_guest")}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="align-top">
                    {q.answer ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        {t("status_answered")}
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        {t("status_pending")}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="align-top whitespace-nowrap text-muted-foreground">
                    {format(new Date(q.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={q.isVisible}
                        disabled={updatingQuestionId === q._id}
                        onCheckedChange={() =>
                          handleToggleVisibility(q._id, q.isVisible)
                        }
                      />
                      {q.isVisible ? (
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="align-top text-end">
                    <div className="flex justify-end gap-2">
                      {!q.answer && !q.isFAQ && !answeringId && (
                        <Button
                          size="icon"
                          variant="ghost"
                          title={t("btn_reply")}
                          onClick={() => {
                            setAnsweringId(q._id);
                            setAnswerText("");
                          }}
                        >
                          <MessageSquare />
                        </Button>
                      )}
                      {(q.answer || q.isFAQ) && !answeringId && (
                        <Button
                          size="icon"
                          variant="ghost"
                          title={t("btn_edit_answer")}
                          onClick={() => {
                            setAnsweringId(q._id);
                            setAnswerText(q.answer || "");
                          }}
                        >
                          <Edit />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeletingId(q._id)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirm_delete_title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirm_delete_desc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingId && handleDelete(deletingId)}
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
