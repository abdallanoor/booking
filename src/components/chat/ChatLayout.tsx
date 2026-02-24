"use client";

import { useState, useEffect, Suspense } from "react";
import { ConversationList } from "./ConversationList";
import { ChatWindow } from "./ChatWindow";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function ChatLayoutContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const chatId = searchParams.get("chatId");

  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedConversationId = chatId;

  const setSelectedConversationId = (id: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id) {
      params.set("chatId", id);
      setConversations((prev) =>
        prev.map((c) => (c._id === id ? { ...c, unreadCount: 0 } : c)),
      );
    } else {
      params.delete("chatId");
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Clear unreadCount if a conversation is actively selected
  useEffect(() => {
    if (selectedConversationId) {
      setConversations((prev) => {
        const targetConv = prev.find((c) => c._id === selectedConversationId);
        if (targetConv && targetConv.unreadCount > 0) {
          return prev.map((c) =>
            c._id === selectedConversationId ? { ...c, unreadCount: 0 } : c,
          );
        }
        return prev;
      });
    }
  }, [selectedConversationId, conversations]);

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/chat/conversations");
      const data = await res.json();
      if (data.success) {
        setConversations(data.data.conversations);
      }
    } catch (error) {
      console.error("Failed to fetch conversations", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedConversation = conversations.find(
    (c) => c._id === selectedConversationId,
  );

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      <div
        className={`${selectedConversationId ? "hidden md:flex" : "flex"} w-full md:w-80 flex-col border-r`}
      >
        <ConversationList
          conversations={conversations}
          loading={loading}
          selectedId={selectedConversationId}
          onSelect={(id) => setSelectedConversationId(id)}
        />
      </div>
      <div
        className={`${!selectedConversationId ? "hidden md:flex" : "flex"} flex-1 flex-col`}
      >
        {selectedConversation ? (
          <ChatWindow
            key={selectedConversation._id}
            conversation={selectedConversation}
            onBack={() => setSelectedConversationId(null)}
            onMessageSent={fetchConversations}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground p-8 text-center bg-accent/10">
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mb-4">
              <MessageSquare className="h-6 w-6 opacity-50" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Your Messages
            </h3>
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function ChatLayout() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full overflow-hidden bg-background">
          <div className="w-full md:w-80 flex-col border-r flex">
            <div className="flex flex-col gap-2 p-4 w-full h-full">
              <h2 className="text-xl font-semibold mb-2">Messages</h2>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 bg-accent/10">
            <Skeleton className="h-16 w-16 rounded-full mb-4" />
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      }
    >
      <ChatLayoutContent />
    </Suspense>
  );
}
