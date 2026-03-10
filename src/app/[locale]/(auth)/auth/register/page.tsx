"use client";

import { Suspense } from "react";
import { Link } from "@/navigation";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

function RegisterContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const loginUrl = callbackUrl
    ? `/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/auth/login";

  const t = useTranslations("auth");

  return (
    <div className="w-full max-w-md space-y-4">
      <RegisterForm />
      <p className="text-center text-sm text-muted-foreground">
        {t("already_have_account")}{" "}
        <Link href={loginUrl} className="font-medium underline">
          {t("login")}
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <Suspense fallback={<div className="w-full max-w-md" />}>
        <RegisterContent />
      </Suspense>
    </div>
  );
}
