import { ChatLayout } from "@/components/chat/ChatLayout";

export const metadata = {
  title: "Messages | Hosting Dashboard",
};

export default function HostMessagesPage() {
  return (
    <div>
      <div className="bg-card rounded-2xl border overflow-hidden h-[calc(100vh-120px)] min-h-[500px]">
        <ChatLayout />
      </div>
    </div>
  );
}
