"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Camera, Shield, Loader2 } from "lucide-react";
import { uploadAvatarAction, updateUserAction } from "@/actions";
import { toast } from "sonner";
import { PersonalDetails } from "@/components/profile/PersonalDetails";
import { BankDetails } from "@/components/profile/BankDetails";
import { PasswordSettings } from "@/components/profile/PasswordSettings";
import { User } from "@/types";

interface ProfileClientProps {
  initialUser: User;
}

export default function ProfileClient({ initialUser }: ProfileClientProps) {
  const { refreshUser } = useAuth();
  const [user, setUser] = useState<User>(initialUser);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const calculateCompletion = () => {
    let score = 0;
    if (user.name) score += 20;
    if (user.emailVerified) score += 20;
    if (user.phoneNumber) score += 20;
    if (user.country) score += 20;

    const isHostOrAdmin = user.role === "Host" || user.role === "Admin";
    if (isHostOrAdmin) {
      if (user.nationalId) score += 10;
      if (user.bankDetails?.bankName && user.bankDetails?.accountNumber)
        score += 10;
    } else {
      if (user.nationalId) score += 20;
    }
    return Math.min(score, 100);
  };

  const completionPercentage = calculateCompletion();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadResult = await uploadAvatarAction(formData);

      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.message || "Failed to upload image");
      }

      const updateResult = await updateUserAction({
        name: user.name,
        avatar: uploadResult.url,
      });

      if (updateResult.success) {
        toast.success("Profile photo updated");
        const updatedUser = { ...user, avatar: uploadResult.url };
        setUser(updatedUser);
        await refreshUser();
      }
    } catch (error) {
      console.error(error);
      toast.error("Error uploading photo");
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
        <div className="bg-card rounded-2xl border overflow-hidden grid md:grid-cols-[320px_1fr]">
          {/* Left Panel: Profile Overview */}
          <div className="bg-primary/5 flex flex-col items-center text-center border-b md:border-b-0 md:border-r border-border/50">
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

            <div className="w-full space-y-4 p-8 border-t border-border text-left text-sm text-muted-foreground">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span>Completion</span>
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
              <div className="flex justify-between items-center">
                <span>Member Since</span>
                <span className="font-medium text-foreground">
                  {user.createdAt
                    ? format(new Date(user.createdAt), "MMM yyyy")
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Right Panel: Scrollable Forms */}
          <div>
            <PersonalDetails user={user} refreshUser={handleUserRefresh} />

            <BankDetails user={user} refreshUser={handleUserRefresh} />

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
