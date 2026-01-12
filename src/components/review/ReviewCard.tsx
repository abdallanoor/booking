"use client";

import { format } from "date-fns";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Review } from "@/types";

interface ReviewCardProps {
  review: Review;
  showFullReview?: boolean;
  onShowMore?: () => void;
}

export function ReviewCard({ review, showFullReview = false, onShowMore }: ReviewCardProps) {
  const { guest, rating, comment, createdAt } = review;

  // Count words in the comment
  const wordCount = comment ? comment.trim().split(/\s+/).length : 0;
  const WORD_LIMIT = 20;
  const shouldTruncate = !showFullReview && wordCount > WORD_LIMIT;

  // Get truncated comment (first 20 words)
  const getTruncatedComment = () => {
    if (!comment) return "";
    const words = comment.trim().split(/\s+/);
    return words.slice(0, WORD_LIMIT).join(" ");
  };

  const displayComment = shouldTruncate ? getTruncatedComment() : comment;

  return (
    <div className="pb-6">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Avatar className="w-10 h-10 shrink-0">
          <AvatarImage src={guest.avatar} />
          <AvatarFallback>{guest.name[0].toUpperCase()}</AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Guest name and date */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{guest.name}</span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(createdAt), "MMM yyyy")}
              </span>
            </div>
          </div>

          {/* Star rating */}
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-3 w-3 ${star <= rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-muted text-muted-foreground"
                  }`}
              />
            ))}
          </div>

          {/* Comment */}
          {comment && (
            <div className="space-y-1">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                {displayComment}
                {shouldTruncate && "..."}
              </p>
              {shouldTruncate && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={onShowMore}
                  className="h-auto p-0 text-sm font-semibold underline"
                >
                  Show More
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
