import { ChatLayout } from "@/components/chat/ChatLayout";

export const metadata = {
  title: "Messages | Booking Platform",
};

export default function MessagesPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-card rounded-2xl border overflow-hidden h-[calc(100vh-120px)] min-h-[500px]">
        <ChatLayout />
      </div>
    </div>
  );
}
