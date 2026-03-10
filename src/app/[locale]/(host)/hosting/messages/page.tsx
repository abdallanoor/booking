"use client";

import { ChatLayout } from "@/components/chat/ChatLayout";
import { useTranslations } from "next-intl";

export default function HostMessagesPage() {
  const t = useTranslations("hosting");
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("messages_title")}
        </h1>
      </div>
      <div className="bg-card rounded-2xl border overflow-hidden h-[calc(100vh-180px)] min-h-[500px]">
        <ChatLayout />
      </div>
    </div>
  );
}
