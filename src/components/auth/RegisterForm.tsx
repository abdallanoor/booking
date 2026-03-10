"use client";

import { useState, useTransition } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { GoogleLoginBtn } from "./GoogleLoginBtn";
import { useRouter } from "nextjs-toploader/app";
import { useSearchParams } from "next/navigation";
import { authService } from "@/services/auth.service";
import { useTranslations } from "next-intl";

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"Guest" | "Host">("Guest");
  const t = useTranslations("auth");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        await authService.register({ name, email, password, role });
        toast.success(t("verification_sent"));
        router.push(
          `/auth/verify-otp?email=${encodeURIComponent(email)}&callbackUrl=${encodeURIComponent(callbackUrl)}`,
        );
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : t("registration_failed"),
        );
      }
    });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t("register_title")}</CardTitle>
        <CardDescription>{t("register_desc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("full_name_label")}</Label>
            <Input
              id="name"
              type="text"
              placeholder={t("full_name_placeholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("email_label")}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("email_placeholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("i_want_to")}</Label>
            <Tabs
              value={role}
              onValueChange={(value) => setRole(value as "Guest" | "Host")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="Guest" disabled={isPending}>
                  {t("book_listings")}
                </TabsTrigger>
                <TabsTrigger value="Host" disabled={isPending}>
                  {t("list_my_listing")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isPending}
          >
            {isPending ? t("creating_account") : t("sign_up_button")}
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
