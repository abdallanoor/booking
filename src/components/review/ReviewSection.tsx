"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ReviewForm } from "./ReviewForm";
import { ReviewList } from "./ReviewList";
import { getReviews } from "@/services/reviews.service";
import type { Review } from "@/types";
import { useState } from "react";

interface ReviewSectionProps {
  listingId: string;
  initialReviews?: Review[];
}

export function ReviewSection({
  listingId,
  initialReviews = [],
}: ReviewSectionProps) {
  const searchParams = useSearchParams();
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [isLoading, setIsLoading] = useState(false);

  // Handle ?review=true query param to scroll to review form
  useEffect(() => {
    const shouldShowReview = searchParams.get("review") === "true";
    if (shouldShowReview) {
      setTimeout(() => {
        const reviewForm = document.getElementById("review");
        if (reviewForm) {
          reviewForm.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, [searchParams]);

  const handleReviewSubmitted = async () => {
    // Refresh reviews after submission
    setIsLoading(true);
    try {
      const updatedReviews = await getReviews(listingId);
      setReviews(updatedReviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 scroll-mt-8" id="review">
      {/* Review Form */}
      <ReviewForm
        listingId={listingId}
        onReviewSubmitted={handleReviewSubmitted}
      />

      {/* Reviews List */}
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading reviews...</p>
        </div>
      ) : (
        <ReviewList reviews={reviews} />
      )}
    </div>
  );
}
