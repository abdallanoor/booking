"use client";

import { Button } from "@/components/ui/button";
import { ReviewCard } from "./ReviewCard";
import type { Review } from "@/types";

interface ReviewListProps {
  reviews: Review[];
}

export function ReviewList({ reviews }: ReviewListProps) {
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
      <div className="space-y-6 grid grid-cols-1 md:grid-cols-2">
        {reviews.slice(0, 6).map((review) => (
          <ReviewCard key={review._id} review={review} />
        ))}
      </div>
      {reviews.length > 6 && (
        <Button
          variant="secondary"
          className="flex justify-center items-center w-fit mx-auto"
        >
          Show all {reviews.length} reviews
        </Button>
      )}
    </div>
  );
}
