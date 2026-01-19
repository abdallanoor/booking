"use client";

import { useState, useCallback } from "react";
import { Question } from "@/types";
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
import { useRouter } from "next/navigation";
import Link from "next/link";

interface HostQuestionsClientProps {
  initialQuestions: Question[];
  listingId: string;
  listingTitle: string;
}

export default function HostQuestionsClient({
  initialQuestions,
  listingId,
  listingTitle,
}: HostQuestionsClientProps) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingQuestionId, setUpdatingQuestionId] = useState<string | null>(
    null,
  );
  const router = useRouter();

  // FAQ State
  const [isFAQDialogOpen, setIsFAQDialogOpen] = useState(false);
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");

  const refreshQuestions = useCallback(async () => {
    try {
      // Option 1: Client-side fetch API
      const data = await getHostListingQuestions(listingId);
      setQuestions(data);
      // Option 2: Server refresh (slower but keeps data consistent with server cache)
      // router.refresh();
      // For editing/toggling, client fetch is often snappier, but let's stick to what was working.
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast.error("Failed to refresh questions");
    }
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
      toast.success("Visibility updated");
      router.refresh(); // Sync server cache
    } catch (error) {
      console.error(error);
      toast.error("Failed to update visibility");
    } finally {
      setUpdatingQuestionId(null);
    }
  };

  const handleSubmitAnswer = async (id: string) => {
    if (!answerText.trim()) return;

    setIsSubmitting(true);
    try {
      await updateQuestion(id, { answer: answerText });

      toast.success("Answer submitted");
      setAnsweringId(null);
      setAnswerText("");
      refreshQuestions();
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit answer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateFAQ = async () => {
    if (!faqQuestion.trim() || !faqAnswer.trim()) {
      toast.error("Question and answer are required");
      return;
    }

    setIsSubmitting(true);
    try {
      await createFAQ(listingId, {
        question: faqQuestion,
        answer: faqAnswer,
      });

      toast.success("FAQ created");
      setIsFAQDialogOpen(false);
      setFaqQuestion("");
      setFaqAnswer("");
      refreshQuestions();
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create FAQ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      await deleteQuestion(id);

      setQuestions((prev) => prev.filter((q) => q._id !== id));
      toast.success("Question deleted");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete question");
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <Link href="/hosting/listings" className="order-1">
          <Button variant="secondary" size="icon" className="rounded-full">
            <ChevronLeft />
          </Button>
        </Link>
        <div className="order-3 md:order-2 w-full md:w-auto md:flex-1">
          <h1 className="text-2xl font-bold">Q&A Management</h1>
          <p className="text-muted-foreground">
            Manage questions and create FAQs for{" "}
            <span className="font-semibold">{listingTitle}</span>
          </p>
        </div>
        <Dialog open={isFAQDialogOpen} onOpenChange={setIsFAQDialogOpen}>
          <DialogTrigger asChild>
            <Button className="order-2 md:order-3">Add FAQ</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add FAQ</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Question</Label>
                <Input
                  value={faqQuestion}
                  onChange={(e) => setFaqQuestion(e.target.value)}
                  placeholder="e.g. Is breakfast included?"
                />
              </div>
              <div className="space-y-2">
                <Label>Answer</Label>
                <Textarea
                  value={faqAnswer}
                  onChange={(e) => setFaqAnswer(e.target.value)}
                  placeholder="Type the answer here..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateFAQ} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save FAQ"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsFAQDialogOpen(false)}
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[300px]">Question</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Asked</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  No questions yet.
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
                          placeholder="Type your answer..."
                          className="resize-none"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSubmitAnswer(q._id)}
                            disabled={isSubmitting}
                          >
                            Submit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setAnsweringId(null);
                              setAnswerText("");
                            }}
                          >
                            Cancel
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
                      <Badge variant="secondary">FAQ</Badge>
                    ) : (
                      <Badge variant="outline">Guest</Badge>
                    )}
                  </TableCell>
                  <TableCell className="align-top">
                    {q.answer ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Answered
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        Pending
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
                  <TableCell className="align-top text-right">
                    <div className="flex justify-end gap-2">
                      {!q.answer && !q.isFAQ && !answeringId && (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Reply"
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
                          title="Edit Answer"
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
                        onClick={() => handleDelete(q._id)}
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
    </>
  );
}
