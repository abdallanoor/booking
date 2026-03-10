"use client";

import { useState, useTransition } from "react";
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

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const t = useTranslations("auth");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        await authService.forgotPassword(email);
        setIsSuccess(true);
        toast.success(t("reset_email_sent"));
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : t("failed_reset_email"),
        );
      }
    });
  };

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("check_email_title")}</CardTitle>
          <CardDescription>{t("check_email_desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {t("check_email_note")}
          </p>
          <Link href="/auth/login">
            <Button variant="outline" className="w-full">
              {t("back_to_login")}
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t("forgot_password_title")}</CardTitle>
        <CardDescription>{t("forgot_password_desc")}</CardDescription>
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
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? t("sending") : t("send_reset_link")}
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
