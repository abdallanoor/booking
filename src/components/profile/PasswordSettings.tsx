"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePasswordAction } from "@/actions";
import { toast } from "sonner";
import { Loader2, Save as SaveIcon } from "lucide-react";
import { useTranslations } from "next-intl";

interface PasswordSettingsProps {
  hasPassword?: boolean;
  refreshUser?: () => Promise<void>;
}

export function PasswordSettings({
  hasPassword,
  refreshUser,
}: PasswordSettingsProps) {
  const t = useTranslations("password_settings");
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleFormChange = () => {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);

    const currentPass = formData.get("currentPassword") as string;
    const newPass = formData.get("newPassword") as string;
    const confirmPass = formData.get("confirmPassword") as string;

    const hasContent = !!currentPass || !!newPass || !!confirmPass;
    setIsDirty(hasContent);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      toast.error(t("pass_mismatch"));
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      toast.error(t("pass_length"));
      setLoading(false);
      return;
    }

    try {
      const result = await changePasswordAction(currentPassword, newPassword);

      if (result.success) {
        toast.success(t("success"));
        formRef.current?.reset();
        setIsDirty(false);
        if (refreshUser) {
          await refreshUser();
        }
      } else {
        toast.error(result.message || t("failed"));
      }
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : t("unexpected_error");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 border-t border-border mt-8">
      <div className="flex items-start justify-between mb-8">
        <div className="text-start">
          <h3 className="text-lg font-semibold text-foreground">
            {hasPassword ? t("change_title") : t("set_title")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {hasPassword ? t("change_desc") : t("set_desc")}
          </p>
        </div>
        <Button
          form="password-settings-form"
          type="submit"
          disabled={loading || !isDirty}
          className="max-sm:h-10"
          variant="secondary"
        >
          {loading ? <Loader2 className="animate-spin" /> : <SaveIcon />}
          <span className="hidden sm:inline">
            {hasPassword ? t("update_btn") : t("set_btn")}
          </span>
        </Button>
      </div>

      <form
        id="password-settings-form"
        ref={formRef}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <div className="grid gap-6 max-w-md">
          {hasPassword && (
            <div className="space-y-2 text-start">
              <Label htmlFor="currentPassword">{t("current_pass")}</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                className="text-start"
                required
              />
            </div>
          )}

          <div className="space-y-2 text-start">
            <Label htmlFor="newPassword">{t("new_pass")}</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              className="text-start"
              required
            />
          </div>

          <div className="space-y-2 text-start">
            <Label htmlFor="confirmPassword">{t("confirm_pass")}</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              className="text-start"
              required
            />
          </div>
        </div>
      </form>
    </div>
  );
}
