"use client";

import { useRef, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Camera, Shield, Loader2 } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { ar } from "date-fns/locale";
import { uploadImagesAction, updateUserAction } from "@/actions";
import { toast } from "sonner";
import { PersonalDetails } from "@/components/profile/PersonalDetails";
import { PasswordSettings } from "@/components/profile/PasswordSettings";
import { SavedCards } from "@/components/profile/SavedCards";
import { BankDetails } from "@/components/profile/BankDetails";
import { IdentityVerification } from "@/components/profile/IdentityVerification";
import { User } from "@/types";
import { calculateProfileScore } from "@/lib/profile";
import { useRouter } from "@/navigation";

export default function ProfilePage() {
  const { user: authUser, loading, refreshUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const t = useTranslations("profile_page");
  const locale = useLocale();
  const dateLocale = locale === "ar" ? ar : undefined;

  useEffect(() => {
    if (!loading && !authUser) {
      router.push("/");
    } else if (authUser) {
      setUser({ ...authUser, _id: authUser.id } as User);
    }
  }, [authUser, loading, router]);

  if (loading || !user) {
    return (
      <div className="py-10">
        <div className="container">
          <div className="rounded-4xl border overflow-hidden grid md:grid-cols-[320px_1fr]">
            {/* Left Panel Skeleton */}
            <div className="bg-primary/5 flex flex-col items-center text-center border-b md:border-b-0 md:border-r border-border/50">
              <div className="p-8 w-full flex flex-col items-center gap-4">
                <Skeleton className="h-32 w-32 rounded-full bg-primary/5" />
                <Skeleton className="h-6 w-3/4 mt-2 bg-primary/5" />
                <Skeleton className="h-4 w-full mt-1 bg-primary/5" />
                <Skeleton className="h-6 w-24 rounded-full mt-2 bg-primary/5" />
              </div>
              <div className="w-full space-y-4 p-8 border-t border-border mt-auto">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-24 bg-primary/5" />
                  <Skeleton className="h-4 w-12 bg-primary/5" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
                <div className="flex justify-between items-center pt-2">
                  <Skeleton className="h-4 w-28 bg-primary/5" />
                  <Skeleton className="h-4 w-24 bg-primary/5" />
                </div>
              </div>
            </div>

            {/* Right Panel Skeleton */}
            <div className="p-8 space-y-10">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-6">
                  <div className="flex items-center justify-between border-b border-border/50 pb-4">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-9 w-24 rounded-4xl" />
                  </div>
                  <div className="grid md:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 w-full rounded-4xl" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-10 w-full rounded-4xl" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const completionPercentage = calculateProfileScore(user);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      toast.error(t("file_size_error"));
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("files", file);
    formData.append("folder", "booking-app/avatars");

    try {
      const uploadResult = await uploadImagesAction(formData);

      if (!uploadResult.success || !uploadResult.urls?.[0]) {
        throw new Error(uploadResult.message || t("upload_failed"));
      }

      const updateResult = await updateUserAction({
        name: user.name,
        avatar: uploadResult.urls[0],
      });

      if (updateResult.success) {
        toast.success(t("photo_updated"));
        const updatedUser = { ...user, avatar: uploadResult.urls[0] };
        setUser(updatedUser);
        await refreshUser();
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("upload_error");
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleUserRefresh = async () => {
    const res = await fetch("/api/auth/me");
    if (res.ok) {
      const data = await res.json();
      setUser(data.data.user);
    }
    await refreshUser();
  };

  return (
    <div className="py-10">
      <div className="container">
        <div className="rounded-4xl border overflow-hidden grid md:grid-cols-[320px_1fr]">
          {/* Left Panel: Profile Overview */}
          <div className="bg-primary/5 flex flex-col items-center text-center border-b md:border-b-0 md:border-r md:rtl:border-r-0 md:rtl:border-l border-border/50">
            <div className="p-8 w-full">
              <div className="flex flex-col items-center gap-4">
                <div
                  className="relative group cursor-pointer mb-1"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Avatar className="h-32 w-32 transition-transform duration-300 group-hover:scale-105">
                    <AvatarImage src={user.avatar} className="object-cover" />
                    <AvatarFallback className="text-4xl bg-primary text-primary-foreground font-semibold">
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 rounded-full bg-black/10 opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300 pointer-events-none" />

                  <div className="absolute bottom-1 right-1 h-8 w-8 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
                    {uploading ? (
                      <Loader2 className="h-4 w-4 text-white animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4 text-white" />
                    )}
                  </div>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileSelect}
                />
              </div>

              <h2 className="text-xl font-bold text-foreground mb-1">
                {user.name}
              </h2>
              <p className="text-sm text-muted-foreground mb-3 break-all">
                {user.email}
              </p>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                <Shield className="h-3 w-3" />
                <span className="capitalize">{user.role}</span>
              </div>
            </div>

            <div className="w-full space-y-4 p-8 border-t border-border text-start text-sm text-muted-foreground">
              <div>
                <div className="flex justify-between items-center mb-2 gap-4">
                  <span>{t("completion")}</span>
                  <span className="font-semibold text-primary">
                    {completionPercentage}%
                  </span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span>{t("member_since")}</span>
                <span className="font-medium text-foreground">
                  {user.createdAt
                    ? format(new Date(user.createdAt), "MMM yyyy", {
                        locale: dateLocale,
                      })
                    : t("not_available")}
                </span>
              </div>
            </div>
          </div>

          {/* Right Panel: Scrollable Forms */}
          <div>
            <PersonalDetails user={user} refreshUser={handleUserRefresh} />

            <IdentityVerification
              identityVerified={user.identityVerified}
              nationalId={user.nationalId}
              onVerified={handleUserRefresh}
            />

            <BankDetails
              bankDetails={user.bankDetails}
              refreshUser={handleUserRefresh}
            />

            <SavedCards user={user} refreshUser={handleUserRefresh} />

            <PasswordSettings
              hasPassword={!!user.hasPassword}
              refreshUser={handleUserRefresh}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
