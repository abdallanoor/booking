"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePasswordAction } from "@/actions";
import { toast } from "sonner";
import { Loader2, Save as SaveIcon } from "lucide-react";

interface PasswordSettingsProps {
  hasPassword?: boolean;
  refreshUser?: () => Promise<void>;
}

export function PasswordSettings({
  hasPassword,
  refreshUser,
}: PasswordSettingsProps) {
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
      toast.error("New passwords do not match");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const result = await changePasswordAction(currentPassword, newPassword);

      if (result.success) {
        toast.success("Password updated successfully");
        formRef.current?.reset();
        setIsDirty(false);
        if (refreshUser) {
          await refreshUser();
        }
      } else {
        toast.error(result.message || "Failed to update password");
      }
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 border-t border-border">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {hasPassword ? "Change Password" : "Set Password"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {hasPassword
              ? "Ensure your account is secure by using a strong password."
              : "Secure your account with a password."}
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
            {hasPassword ? "Update Password" : "Set Password"}
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
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
          </div>
        </div>
      </form>
    </div>
  );
}
