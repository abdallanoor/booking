"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "nextjs-toploader/app";
import { Link } from "@/navigation";
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
import { authService } from "@/services/auth.service";
import { useTranslations } from "next-intl";

interface ResetPasswordFormProps {
  token: string | null;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const t = useTranslations("auth");

  useEffect(() => {
    if (!token) {
      toast.error(t("invalid_reset_token"));
    }
  }, [token, t]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error(t("passwords_not_match"));
      return;
    }

    if (!token) {
      toast.error(t("invalid_reset_token"));
      return;
    }

    startTransition(async () => {
      try {
        await authService.resetPassword(token, password);
        toast.success(t("reset_success"));
        setTimeout(() => {
          router.push("/auth/login");
        }, 1500);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("reset_failed"));
      }
    });
  };

  if (!token) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("invalid_reset_link_title")}</CardTitle>
          <CardDescription>{t("invalid_reset_link_desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/auth/forgot-password">
            <Button variant="outline" className="w-full">
              {t("request_new_link")}
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t("reset_password_title")}</CardTitle>
        <CardDescription>{t("reset_password_desc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">{t("new_password_label")}</Label>
            <Input
              id="password"
              type="password"
              placeholder={t("password_placeholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              {t("confirm_password_label")}
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder={t("password_placeholder")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? t("resetting") : t("reset_password_button")}
          </Button>

          <div className="text-center text-sm">
            <Link
              href="/auth/login"
              className="text-muted-foreground hover:text-primary"
            >
              {t("back_to_login")}
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
