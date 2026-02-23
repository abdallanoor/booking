"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export function ConversationList({
  conversations,
  loading,
  selectedId,
  onSelect,
}: {
  conversations: any[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-4 overflow-y-auto w-full h-full">
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
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No conversations yet
      </div>
    );
  }

  const sortedConversations = [...conversations].sort((a, b) => {
    const aUnread = a.unreadCount > 0 ? 1 : 0;
    const bUnread = b.unreadCount > 0 ? 1 : 0;
    if (aUnread !== bUnread) {
      return bUnread - aUnread;
    }
    const timeA = new Date(a.lastMessageAt || 0).getTime();
    const timeB = new Date(b.lastMessageAt || 0).getTime();
    return timeB - timeA;
  });

  return (
    <div className="flex flex-col gap-2 p-4 overflow-y-auto w-full h-full">
      <h2 className="text-xl font-semibold mb-2">Messages</h2>
      {sortedConversations.map((conv) => {
        const otherParticipant = conv.participants.find(
          (p: any) => p._id !== user?.id,
        );
        const isSelected = selectedId === conv._id;
        const showUnread = conv.unreadCount > 0;

        return (
          <div
            key={conv._id}
            onClick={() => onSelect(conv._id)}
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
              isSelected ? "bg-accent" : "hover:bg-accent/50"
            }`}
          >
            <div className="relative">
              <Avatar className="h-12 w-12 border">
                <AvatarImage src={otherParticipant?.avatar} />
                <AvatarFallback>
                  {otherParticipant?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {showUnread && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-sm ring-2 ring-background">
                  {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <span
                  className={`truncate ${showUnread ? "font-bold text-foreground" : "font-medium"}`}
                >
                  {otherParticipant?.name}
                </span>
                {conv.lastMessageAt && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                    {formatDistanceToNow(new Date(conv.lastMessageAt), {
                      addSuffix: true,
                    })}
                  </span>
                )}
              </div>
              <p
                className={`text-xs truncate ${showUnread ? "font-medium text-foreground" : "text-muted-foreground"}`}
              >
                {conv.booking?.listing?.title}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
