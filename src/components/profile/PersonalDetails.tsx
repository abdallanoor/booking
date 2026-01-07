"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateUserAction, resendVerificationAction } from "@/actions";
import { toast } from "sonner";
import {
  Loader2,
  User as UserIcon,
  Phone,
  Globe,
  CreditCard,
  Save as SaveIcon,
  Mail,
  CheckCircle2,
} from "lucide-react";
import type { User } from "@/types";

// User type from AuthContext uses 'id' instead of '_id'
type ClientUser = Omit<User, "_id"> & { id?: string; _id?: string };

interface PersonalDetailsProps {
  user: ClientUser;
  refreshUser: () => Promise<void>;
}

export function PersonalDetails({ user, refreshUser }: PersonalDetailsProps) {
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // Persistent countdown logic
    const savedUntil = localStorage.getItem("resend_until");
    if (savedUntil) {
      const remaining = Math.ceil((parseInt(savedUntil) - Date.now()) / 1000);
      if (remaining > 0) {
        setCountdown(remaining);
      }
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            localStorage.removeItem("resend_until");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleResendEmail = async () => {
    setResending(true);
    try {
      const result = await resendVerificationAction();
      if (result.success) {
        toast.success("Verification email sent! Please check your inbox.");
        const until = Date.now() + 30 * 1000;
        localStorage.setItem("resend_until", until.toString());
        setCountdown(30);
      } else {
        toast.error(result.message || "Failed to resend verification email");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const handleFormChange = () => {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);

    const currentValues = {
      name: formData.get("name") as string,
      phoneNumber: formData.get("phoneNumber") as string,
      country: formData.get("country") as string,
      nationalId: formData.get("nationalId") as string,
    };

    const initialValues = {
      name: user.name || "",
      phoneNumber: user.phoneNumber || "",
      country: user.country || "",
      nationalId: user.nationalId || "",
    };

    const hasChanged =
      JSON.stringify(currentValues) !== JSON.stringify(initialValues);
    setIsDirty(hasChanged);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const phoneNumber = formData.get("phoneNumber") as string;
    const country = formData.get("country") as string;
    const nationalId = formData.get("nationalId") as string;

    try {
      const result = await updateUserAction({
        name,
        avatar: user.avatar,
        phoneNumber,
        country,
        nationalId,
      });
      if (result.success) {
        toast.success("Personal details updated successfully");
        await refreshUser();
        setIsDirty(false);
      } else {
        toast.error(result.message || "Failed to update profile");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-foreground">
            Personal Details
          </h3>
          <p className="text-sm text-muted-foreground">
            Update your account information and contact details.
          </p>
        </div>
        <Button
          form="personal-details-form"
          type="submit"
          disabled={loading || !isDirty}
          className="max-sm:h-10"
          variant="secondary"
        >
          {loading ? <Loader2 className="animate-spin" /> : <SaveIcon />}
          <span className="hidden sm:inline">Save</span>
        </Button>
      </div>

      <form
        id="personal-details-form"
        ref={formRef}
        onChange={handleFormChange}
        onSubmit={handleUpdate}
        className="space-y-6"
      >
        <div className="grid gap-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Full Name
            </Label>
            <div className="relative group">
              <UserIcon className="absolute left-3 top-2/4 -translate-y-2/4 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                id="name"
                name="name"
                defaultValue={user.name}
                className="pl-9"
                placeholder="Your full name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              {user.emailVerified ? (
                <div className="flex items-center gap-1 text-xs font-bold text-green-600 px-1.5 py-0.5 tracking-tight">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleResendEmail}
                  disabled={resending || countdown > 0}
                  className="text-xs font-bold cursor-pointer text-primary hover:text-primary/80 tracking-tight disabled:text-muted-foreground disabled:cursor-default"
                >
                  {resending ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Sending...
                    </span>
                  ) : countdown > 0 ? (
                    `Resend in ${countdown}s`
                  ) : (
                    "Verify Now"
                  )}
                </button>
              )}
            </div>
            <div className="relative group">
              <Mail className="absolute left-3 top-2/4 -translate-y-2/4 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                id="email"
                value={user.email}
                readOnly
                disabled
                className="pl-9 bg-secondary/5 border-dashed border-muted-foreground/20 cursor-not-allowed"
              />
            </div>
            {!user.emailVerified && (
              <p className="text-xs text-amber-600">
                Your account is currently limited until your email is verified.
              </p>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="text-sm font-medium">
              Phone Number
            </Label>
            <div className="relative group">
              <Phone className="absolute left-3 top-2/4 -translate-y-2/4 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                id="phoneNumber"
                name="phoneNumber"
                defaultValue={user.phoneNumber}
                className="pl-9"
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country" className="text-sm font-medium">
              Country
            </Label>
            <div className="relative group">
              <Globe className="absolute left-3 top-2/4 -translate-y-2/4 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                id="country"
                name="country"
                defaultValue={user.country}
                className="pl-9"
                placeholder="e.g. United States"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nationalId" className="text-sm font-medium">
            National ID / Passport Number
          </Label>
          <div className="relative group">
            <CreditCard className="absolute left-3 top-2/4 -translate-y-2/4 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              id="nationalId"
              name="nationalId"
              defaultValue={user.nationalId}
              className="pl-9"
              placeholder="Provide your ID number for verification"
            />
          </div>
        </div>
      </form>
    </div>
  );
}
