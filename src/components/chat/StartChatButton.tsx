"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface StartChatButtonProps {
  bookingId: string;
  isHost?: boolean;
  iconOnly?: boolean;
}

export function StartChatButton({
  bookingId,
  isHost = false,
  iconOnly = false,
}: StartChatButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const startChat = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();

      if (data.success) {
        router.push(
          isHost
            ? `/hosting/messages?chatId=${data.data.conversation._id}`
            : `/messages?chatId=${data.data.conversation._id}`,
        );
      } else {
        toast.error(data.message || "Failed to start chat");
      }
    } catch (error) {
      toast.error("Failed to start chat. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={startChat}
      disabled={loading}
      variant="outline"
      size={iconOnly ? "icon" : "default"}
      className={iconOnly ? "" : "w-full mt-4"}
      title={isHost ? "Message Guest" : "Message Host"}
    >
      <MessageSquare className={iconOnly ? "h-4 w-4" : "mr-2 h-4 w-4"} />
      {!iconOnly && (isHost ? "Message Guest" : "Message Host")}
    </Button>
  );
}
