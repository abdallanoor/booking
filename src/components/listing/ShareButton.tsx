"use client";

import { Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface ShareButtonProps {
  listingTitle: string;
}

export function ShareButton({ listingTitle }: ShareButtonProps) {
  const t = useTranslations("listing_components");

  const handleShare = async () => {
    const shareData = {
      title: listingTitle,
      text: t("share_text", { title: listingTitle }),
      url: window.location.href,
    };

    // Check if Web Share API is supported
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // User cancelled the share
        if (error instanceof Error && error.name !== "AbortError") {
          toast.error(t("share_failed"));
        }
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success(t("link_copied"));
      } catch {
        toast.error(t("copy_failed"));
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
      <span className="max-sm:hidden">{t("share")}</span>
    </Button>
  );
}
