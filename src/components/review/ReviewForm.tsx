"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createReview, checkEligibility } from "@/services/reviews.service";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface ReviewFormProps {
  listingId: string;
  onReviewSubmitted?: () => void;
}

export function ReviewForm({ listingId, onReviewSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eligibility, setEligibility] = useState<{
    eligible: boolean;
    reason?: string;
    booking?: { _id: string; checkIn: string; checkOut: string };
  } | null>(null);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const t = useTranslations("reviews");

  // Check eligibility on mount
  useEffect(() => {
    checkEligibility(listingId)
      .then((result) => {
        setEligibility(result);
      })
      .catch((error) => {
        console.error("Error checking eligibility:", error);
        toast.error("Failed to check review eligibility");
      });
  }, [listingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rating) {
      toast.error(t("select_rating_error"));
      return;
    }

    setIsSubmitting(true);

    try {
      // bookingId is optional - backend will auto-select the most recent eligible booking
      await createReview({
        listingId,
        rating,
        comment: comment.trim() || undefined,
      });

      toast.success(t("submit_success"));
      setReviewSubmitted(true);
      setRating(0);
      setComment("");
      onReviewSubmitted?.();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : t("submit_error");
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!eligibility) {
    return null;
  }

  if (!eligibility.eligible || reviewSubmitted) {
    return null;
  }

  return (
    <div className="border rounded-2xl p-6 space-y-6">
      <div className="text-start">
        <h3 className="font-semibold text-lg mb-1">{t("share_experience")}</h3>
        <p className="text-sm text-muted-foreground">{t("help_travelers")}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-start">
        {/* Star Rating */}
        <div className="space-y-2">
          <Label>
            {t("rating_label")} <span className="text-destructive">*</span>
          </Label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= (hoveredRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-muted text-muted-foreground"
                  }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="mx-2 text-sm text-muted-foreground">
                {t("stars", { count: rating })}
              </span>
            )}
          </div>
        </div>

        {/* Comment */}
        <div className="space-y-2">
          <Label htmlFor="comment">{t("review_label")}</Label>
          <Textarea
            id="comment"
            placeholder={t("review_placeholder")}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={5}
            maxLength={2000}
            className="text-start"
          />
          <p className="text-xs text-muted-foreground">
            {t("characters_count", { count: comment.length })}
          </p>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting || !rating}
          className="w-full"
        >
          {isSubmitting ? t("submitting") : t("submit_review")}
        </Button>
      </form>
    </div>
  );
}
