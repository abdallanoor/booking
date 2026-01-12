"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  createReview,
  checkEligibility,
} from "@/services/reviews.service";
import { toast } from "sonner";

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
      toast.error("Please select a rating");
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

      toast.success("Review submitted successfully!");
      setReviewSubmitted(true);
      setRating(0);
      setComment("");
      onReviewSubmitted?.();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to submit review. Please try again.";
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
      <div>
        <h3 className="font-semibold text-lg mb-1">Share Your Experience</h3>
        <p className="text-sm text-muted-foreground">
          Help other travelers by sharing your experience
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Star Rating */}
        <div className="space-y-2">
          <Label>
            Rating <span className="text-destructive">*</span>
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
                  className={`h-8 w-8 ${star <= (hoveredRating || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-muted text-muted-foreground"
                    }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-sm text-muted-foreground">
                {rating} {rating === 1 ? "star" : "stars"}
              </span>
            )}
          </div>
        </div>

        {/* Comment */}
        <div className="space-y-2">
          <Label htmlFor="comment">Your Review (Optional)</Label>
          <Textarea
            id="comment"
            placeholder="Share details about your experience..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={5}
            maxLength={2000}
          />
          <p className="text-xs text-muted-foreground">
            {comment.length}/2000 characters
          </p>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting || !rating}
          className="w-full"
        >
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </Button>
      </form>
    </div>
  );
}
