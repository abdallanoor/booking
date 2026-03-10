"use client";

import { useState, useTransition } from "react";
import { Link } from "@/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { GoogleLoginBtn } from "./GoogleLoginBtn";
import { useRouter } from "nextjs-toploader/app";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const { login } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const t = useTranslations("auth");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        await login(email, password);
        toast.success(t("login_success"));
        router.push(callbackUrl);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("login_failed"));
      }
    });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t("login_title")}</CardTitle>
        <CardDescription>{t("login_desc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("email_label")}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("email_placeholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t("password_label")}</Label>
            <Input
              id="password"
              type="password"
              placeholder={t("password_placeholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="current-password"
              disabled={isPending}
            />
            <div className="flex mt-1 justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-xs text-muted-foreground hover:text-primary hover:underline"
              >
                {t("forgot_password_link")}
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isPending}
          >
            {isPending ? t("logging_in") : t("login_title")}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                {t("or_continue_with")}
              </span>
            </div>
          </div>

          <GoogleLoginBtn disabled={isPending} callbackUrl={callbackUrl} />
        </form>
      </CardContent>
    </Card>
  );
}
