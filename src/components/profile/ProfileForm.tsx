"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateUserAction } from "@/actions";
import { toast } from "sonner";
import {
  Loader2,
  User as UserIcon,
  Globe,
  Save as SaveIcon,
  Mail,
  CheckCircle2,
} from "lucide-react";
import type { User } from "@/types";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { PhoneVerification } from "./PhoneVerification";

// User type from AuthContext uses 'id' instead of '_id'
export type ClientUser = Omit<User, "_id"> & { id?: string; _id?: string };

interface ProfileFormProps {
  user: ClientUser;
  onSuccess?: () => void; // Called after successful update
  className?: string; // Additional classes for wrapper
  isDialog?: boolean; // Changes layout slightly for dialog content
}

export function ProfileForm({
  user,
  onSuccess,
  className,
  isDialog = false,
}: ProfileFormProps) {
  const t = useTranslations("personal_details");
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // validation state
  const [isValid, setIsValid] = useState(() => {
    return !!(user.name && user.country);
  });

  const [verifiedPhone, setVerifiedPhone] = useState(user.phoneNumber || "");

  const formRef = useRef<HTMLFormElement>(null);

  const handleFormChange = () => {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);

    const currentValues = {
      name: (formData.get("name") as string).trim(),
      country: (formData.get("country") as string).trim(),
    };

    const initialValues = {
      name: (user.name || "").trim(),
      country: (user.country || "").trim(),
    };

    // Check if distinct
    const hasChanged =
      JSON.stringify(currentValues) !== JSON.stringify(initialValues);
    setIsDirty(hasChanged);

    // Validate
    const valid = !!(currentValues.name && currentValues.country);
    setIsValid(valid);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isValid && isDialog) return;

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const country = formData.get("country") as string;

    try {
      const result = await updateUserAction({
        name,
        avatar: user.avatar,
        phoneNumber: verifiedPhone || user.phoneNumber,
        country,
      });
      if (result.success) {
        if (!isDialog) {
          toast.success(t("update_success"));
        }
        setIsDirty(false);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(result.message || t("update_failed"));
      }
    } catch {
      toast.error(t("unexpected_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn(!isDialog && "p-6 md:p-10", className)}>
      {!isDialog && (
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold text-foreground">{t("title")}</h3>
            <p className="text-sm text-muted-foreground">{t("description")}</p>
          </div>
          <Button
            form="personal-details-form"
            type="submit"
            disabled={loading || !isDirty}
            className="max-sm:h-10"
            variant="secondary"
          >
            {loading ? <Loader2 className="animate-spin" /> : <SaveIcon />}
            <span className="hidden sm:inline">{t("save")}</span>
          </Button>
        </div>
      )}

      <form
        id="personal-details-form"
        ref={formRef}
        onChange={handleFormChange}
        onSubmit={handleUpdate}
        className="space-y-6"
      >
        <div className="grid gap-6">
          <div className="space-y-2 text-start">
            <Label htmlFor="name" className="text-sm font-medium">
              {t("full_name")}
            </Label>
            <div className="relative group">
              <UserIcon className="absolute start-3 top-2/4 -translate-y-2/4 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                id="name"
                name="name"
                defaultValue={user.name}
                className="ps-9"
                placeholder={t("name_placeholder")}
              />
            </div>
          </div>

          {!isDialog && (
            <div className="space-y-2 text-start">
              <div className="flex items-center justify-between">
                <Label htmlFor="email" className="text-sm font-medium">
                  {t("email")}
                </Label>
                {user.emailVerified && (
                  <div className="flex items-center gap-1 text-xs font-bold text-green-600 px-1.5 py-0.5 tracking-tight">
                    <CheckCircle2 className="h-3 w-3" />
                    {t("verified")}
                  </div>
                )}
              </div>
              <div className="relative group">
                <Mail className="absolute start-3 top-2/4 -translate-y-2/4 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  value={user.email}
                  readOnly
                  disabled
                  className="ps-9 bg-secondary/5 border-dashed border-muted-foreground/20 cursor-not-allowed text-start text-foreground/70"
                />
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <PhoneVerification
            currentPhone={verifiedPhone || user.phoneNumber}
            onVerified={(phone) => setVerifiedPhone(phone)}
          />

          <div className="space-y-2 text-start">
            <Label htmlFor="country" className="text-sm font-medium">
              {t("country")}
            </Label>
            <div className="relative group">
              <Globe className="absolute start-3 top-2/4 -translate-y-2/4 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                id="country"
                name="country"
                defaultValue={user.country}
                className="ps-9"
                placeholder={t("country_placeholder")}
              />
            </div>
          </div>
        </div>

        {isDialog && (
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={loading || !isValid}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" />
                  {t("saving")}
                </>
              ) : (
                t("save_continue")
              )}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
