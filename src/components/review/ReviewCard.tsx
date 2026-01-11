"use client";

import { format } from "date-fns";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Review } from "@/types";

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const { guest, rating, comment, createdAt } = review;

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
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
              {comment}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
