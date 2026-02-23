"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send } from "lucide-react";
import { format } from "date-fns";

export function ChatWindow({
  conversation,
  onBack,
}: {
  conversation: any;
  onBack: () => void;
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const otherParticipant = conversation.participants.find(
    (p: any) => p._id !== user?.id,
  );

  const fetchMessages = async () => {
    try {
      const res = await fetch(
        `/api/chat/conversations/${conversation._id}/messages`,
      );
      const data = await res.json();
      if (data.success) {
        setMessages(data.data.messages);
      }
    } catch (error) {
      console.error("Failed to fetch messages", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchMessages();
  }, [conversation._id]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const content = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversation._id,
          content,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [...prev, data.data.message]);
      }
    } catch (error) {
      console.error("Failed to send message", error);
      // Optional: restore message if failed
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Button variant="secondary" size="icon" onClick={onBack}>
          <ArrowLeft />
        </Button>
        <Avatar className="h-10 w-10 border">
          <AvatarImage src={otherParticipant?.avatar} />
          <AvatarFallback>{otherParticipant?.name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold">{otherParticipant?.name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {conversation.booking?.listing?.title}
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && messages.length === 0 ? (
          <div className="space-y-4 opacity-50">
            <div className="flex justify-start">
              <div className="flex gap-2 max-w-[80%]">
                <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                <Skeleton className="h-10 w-32 rounded-2xl rounded-bl-sm" />
              </div>
            </div>
            <div className="flex justify-end">
              <div className="flex gap-2 max-w-[80%] flex-row-reverse">
                <Skeleton className="h-16 w-48 rounded-2xl rounded-br-sm" />
              </div>
            </div>
            <div className="flex justify-start">
              <div className="flex gap-2 max-w-[80%]">
                <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                <Skeleton className="h-12 w-40 rounded-2xl rounded-bl-sm" />
              </div>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <p>No messages yet.</p>
            <p className="text-sm">Send a message to start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender._id === user?.id;
            return (
              <div
                key={msg._id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex items-end gap-2 max-w-[80%] ${isMe ? "flex-row-reverse" : "flex-row"}`}
                >
                  {!isMe && (
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarImage src={msg.sender.avatar} />
                      <AvatarFallback>
                        {msg.sender.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2 ${isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"}`}
                  >
                    <p className="text-sm wrap-break-word whitespace-pre-wrap">
                      {msg.content}
                    </p>
                    <span
                      className={`text-[10px] mt-1 block ${isMe ? "text-primary-foreground/70 text-right" : "text-muted-foreground text-left"}`}
                    >
                      {format(new Date(msg.createdAt), "HH:mm")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-background">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <Input
            type="text"
            className="flex-1 rounded-full px-4 h-10"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending}
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-full shrink-0"
            disabled={!newMessage.trim() || sending}
          >
            <Send />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
