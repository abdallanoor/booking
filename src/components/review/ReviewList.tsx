"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ReviewCard } from "./ReviewCard";
import type { Review } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { StarIcon } from "lucide-react";

interface ReviewListProps {
  reviews: Review[];
}

export function ReviewList({ reviews }: ReviewListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [targetReviewId, setTargetReviewId] = useState<string | null>(null);
  const MAX_VISIBLE_REVIEWS = 4;
  const hasMoreReviews = reviews.length > MAX_VISIBLE_REVIEWS;
  const visibleReviews = hasMoreReviews ? reviews.slice(0, MAX_VISIBLE_REVIEWS) : reviews;

  // Scroll to target review when dialog opens
  useEffect(() => {
    if (isDialogOpen && targetReviewId) {
      // Small timeout to ensure dialog content is rendered
      setTimeout(() => {
        const element = document.getElementById(`review-${targetReviewId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 600);
    }
  }, [isDialogOpen, targetReviewId]);

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No reviews yet. Be the first to review this listing!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Reviews ({reviews.length})</h2>
      </div>

      {/* Show first 6 reviews */}
      <div className="space-y-6 grid grid-cols-1 md:grid-cols-2">
        {visibleReviews.map((review) => (
          <ReviewCard
            key={review._id}
            review={review}
            onShowMore={() => {
              setTargetReviewId(review._id);
              setIsDialogOpen(true);
            }}
          />
        ))}
      </div>

      {/* Dialog for showing all reviews in full */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setTargetReviewId(null);
        }}
      >
        {/* Trigger button - only shown if more than 4 reviews */}
        {hasMoreReviews && (
          <div className="text-center">
            <DialogTrigger asChild suppressHydrationWarning>
              <Button variant="secondary">
                Show all {reviews.length} reviews
              </Button>
            </DialogTrigger>
          </div>
        )}

        <DialogContent variant="drawer" className="md:max-w-xl! max-h-[85vh] flex flex-col" suppressHydrationWarning>
          <DialogHeader>
            <DialogTitle>All reviews ({reviews.length})</DialogTitle>
            <DialogDescription>
              <span className="flex items-center max-sm:justify-center gap-1">
                <StarIcon className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" /> {(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto pr-2 -mr-2 flex-1">
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review._id} id={`review-${review._id}`}>
                  <ReviewCard
                    review={review}
                    showFullReview={true}
                  />
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
