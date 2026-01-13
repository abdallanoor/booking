"use client";

import { Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareButtonProps {
  listingTitle: string;
}

export function ShareButton({ listingTitle }: ShareButtonProps) {
  const handleShare = async () => {
    const shareData = {
      title: listingTitle,
      text: `Check out this listing: ${listingTitle}`,
      url: window.location.href,
    };

    // Check if Web Share API is supported
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // User cancelled the share
        if (error instanceof Error && error.name !== "AbortError") {
          toast.error("Failed to share");
        }
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard");
      } catch {
        toast.error("Failed to copy link");
      }
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="flex gap-2 max-sm:rounded-full max-sm:bg-accent max-sm:size-9"
      onClick={handleShare}
    >
      <Share />
      <span className="max-sm:hidden">Share</span>
    </Button>
  );
}
