"use client";

import { Suspense } from "react";
import { Link } from "@/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const registerUrl = callbackUrl
    ? `/auth/register?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/auth/register";

  const t = useTranslations("auth");

  return (
    <div className="w-full max-w-md space-y-4">
      <LoginForm />
      <p className="text-center text-sm text-muted-foreground">
        {t("dont_have_account")}{" "}
        <Link href={registerUrl} className="font-medium underline">
          {t("sign_up")}
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <Suspense fallback={<div className="w-full max-w-md" />}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
