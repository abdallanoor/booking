"use client";
import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateUserAction, uploadAvatarAction } from "@/actions";
import { toast } from "sonner";
import {
  Loader2,
  Camera,
  Shield,
  Mail,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) {
    return null;
  }

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const avatar = user.avatar;

    try {
      const result = await updateUserAction({ name, avatar });
      if (result.success) {
        toast.success("Profile updated successfully");
        await refreshUser();
      } else {
        toast.error(result.message || "Failed to update profile");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

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

      const newAvatarUrl = uploadResult.url;

      // Update user immediately with new avatar
      const updateResult = await updateUserAction({
        name: user.name,
        avatar: newAvatarUrl,
      });

      if (updateResult.success) {
        toast.success("Avatar updated successfully");
        await refreshUser();
      } else {
        toast.error("Failed to update profile with new avatar");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error uploading image");
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Account Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your personal information and profile appearance.
          </p>
        </div>

        <div className="bg-card rounded-2xl shadow-sm border overflow-hidden grid md:grid-cols-[320px_1fr]">
          {/* Left Panel: Profile Overview */}
          <div className="bg-primary/5 p-8 flex flex-col items-center text-center border-b md:border-b-0 md:border-r border-border/50">
            <div className="flex flex-col items-center gap-4">
              <div
                className="relative group cursor-pointer mb-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <Avatar className="h-32 w-32 transition-transform duration-300 group-hover:scale-105">
                  {user.avatar && (
                    <AvatarImage src={user.avatar} className="object-cover" />
                  )}
                  <AvatarFallback className="text-4xl bg-primary text-primary-foreground font-semibold">
                    {user.name[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 rounded-full bg-black/10 opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300 pointer-events-none" />

                {/* Floating Edit Badge (Always Visible) */}
                <div className="absolute bottom-1 right-1 h-8 w-8 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
                  {uploading ? (
                    <Loader2 className="h-4 w-4 text-white animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4 text-white" />
                  )}
                </div>

                {/* Subtle Hover Overlay */}
              </div>

              {/* Hidden File Input */}
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
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
              <Shield className="h-3 w-3" />
              <span className="capitalize">{user.role}</span>
            </div>

            <div className="w-full space-y-4 pt-6 border-t border-border/50 text-left text-sm text-muted-foreground">
              <div className="flex justify-between items-center">
                <span>Member Since</span>
                <span className="font-medium text-foreground">
                  {user.createdAt
                    ? format(new Date(user.createdAt), "MMM yyyy")
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Status</span>
                {user.emailVerified ? (
                  <span className="flex items-center gap-1.5 text-green-600 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-amber-600 font-medium">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Unverified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Edit Form */}
          <div className="p-5 md:p-10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Personal Details
                </h3>
                <p className="text-sm text-muted-foreground">
                  Update your photo and personal details here.
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Full Name
                  </Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-2/4 -translate-y-2/4 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      name="name"
                      defaultValue={user.name}
                      className="pl-9 h-10 bg-background"
                      placeholder="Your full name"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2/4 -translate-y-2/4 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        value={user.email}
                        disabled
                        className="pl-9 h-10 bg-muted/50 text-muted-foreground"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-medium">
                      Account Role
                    </Label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-2/4 -translate-y-2/4 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="role"
                        value={user.role}
                        disabled
                        className="pl-9 h-10 bg-muted/50 text-muted-foreground capitalize"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border mt-8 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.history.back()}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="min-w-[120px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
