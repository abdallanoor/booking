"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { useTranslations } from "next-intl";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <ResetPasswordForm token={token} />
    </div>
  );
}

export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
          {t("loading")}
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
