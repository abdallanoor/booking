"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IdCard,
  CheckCircle2,
  Upload,
  Clock,
  XCircle,
  Plus,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { submitIdentityVerificationAction } from "@/actions";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface IdentityVerificationProps {
  identityVerified?: boolean;
  nationalId?: string;
  onVerified?: () => void;
}

type VerificationState = {
  status: "none" | "pending" | "approved" | "rejected";
  type?: "national_id" | "passport";
  idNumber?: string;
  rejectionReason?: string;
};

export function IdentityVerification({
  identityVerified,
  nationalId,
}: IdentityVerificationProps) {
  const t = useTranslations("identity_verification");
  const [verification, setVerification] = useState<VerificationState>({
    status: identityVerified ? "approved" : "none",
    idNumber: nationalId,
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!identityVerified);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [docType, setDocType] = useState<"national_id" | "passport">(
    "national_id",
  );
  const [idNumber, setIdNumber] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (identityVerified) {
      setFetching(false);
      return;
    }

    const fetchStatus = async () => {
      try {
        const data = await apiClient.get<{
          data: {
            verification: {
              status: string;
              type: string;
              idNumber: string;
              rejectionReason?: string;
            } | null;
          };
        }>("/user/identity-verification");

        const v = data.data.verification;
        if (v) {
          setVerification({
            status: v.status as VerificationState["status"],
            type: v.type as "national_id" | "passport",
            idNumber: v.idNumber,
            rejectionReason: v.rejectionReason,
          });
        }
      } catch {
        // Silently fail
      } finally {
        setFetching(false);
      }
    };

    fetchStatus();
  }, [identityVerified]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      toast.error(t("file_size_error"));
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error(t("file_type_error"));
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!idNumber.trim() || !selectedFile) {
      toast.error(t("fill_fields"));
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("type", docType);
      formData.append("idNumber", idNumber.trim());
      formData.append("image", selectedFile);

      const result = await submitIdentityVerificationAction(formData);

      if (result.success) {
        toast.success(t("submit_success"));
        setVerification({
          status: "pending",
          type: docType,
          idNumber: idNumber.trim(),
        });
        clearFile();
        setIdNumber("");
      } else {
        toast.error(result.message || t("submit_failed"));
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("unexpected_error");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="p-6 md:p-10 border-t border-border mt-8">
        <div className="mb-8 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-full rounded-4xl" />
        </div>
      </div>
    );
  }

  if (verification.status === "approved") {
    return (
      <div className="p-6 md:p-10 border-t border-border mt-8">
        <div className="mb-8 text-start">
          <h3 className="text-xl font-bold text-foreground">{t("title")}</h3>
          <p className="text-sm text-muted-foreground">{t("verified_desc")}</p>
        </div>

        <div className="space-y-2 text-start">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              {t("doc_national_id_label")}
            </Label>
            <div className="flex items-center gap-1 text-xs font-bold text-green-600 px-1.5 py-0.5 tracking-tight">
              <CheckCircle2 className="h-3 w-3" />
              {t("verified")}
            </div>
          </div>
          <div className="relative group">
            <IdCard className="absolute start-3 top-2/4 -translate-y-2/4 h-4 w-4 text-muted-foreground" />
            <Input
              value={nationalId || verification.idNumber || ""}
              readOnly
              disabled
              className="ps-9 bg-secondary/5 border-dashed border-muted-foreground/20 cursor-not-allowed"
            />
          </div>
        </div>
      </div>
    );
  }

  if (verification.status === "pending") {
    return (
      <div className="p-6 md:p-10 border-t border-border mt-8">
        <div className="mb-8 text-start">
          <h3 className="text-xl font-bold text-foreground">{t("title")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("under_review_desc")}
          </p>
        </div>

        <div className="space-y-2 text-start">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              {verification.type === "national_id"
                ? t("national_id_label")
                : t("passport_label")}
            </Label>
            <div className="flex items-center gap-1 text-xs font-bold text-amber-600 px-1.5 py-0.5 tracking-tight">
              <Clock className="h-3 w-3" />
              {t("pending")}
            </div>
          </div>
          <div className="relative group">
            <IdCard className="absolute start-3 top-2/4 -translate-y-2/4 h-4 w-4 text-muted-foreground" />
            <Input
              value={verification.idNumber || ""}
              readOnly
              disabled
              className="ps-9 bg-secondary/5 border-dashed border-muted-foreground/20 cursor-not-allowed"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 border-t border-border mt-8">
      <div className="flex items-center justify-between mb-8">
        <div className="text-start">
          <h3 className="text-xl font-bold text-foreground">{t("title")}</h3>
          <p className="text-sm text-muted-foreground">
            {verification.status === "rejected"
              ? t("rejected_desc")
              : t("submit_desc")}
          </p>
        </div>
        {!isEditing && (
          <Button
            onClick={() => setIsEditing(true)}
            variant="secondary"
            className="max-sm:size-9"
          >
            {verification.status === "rejected" ? (
              <>
                <Pencil />
                <span className="max-sm:hidden">{t("update_details")}</span>
              </>
            ) : (
              <>
                <Plus />
                <span className="max-sm:hidden">{t("add_details")}</span>
              </>
            )}
          </Button>
        )}
        {isEditing && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsEditing(false)}
            disabled={loading}
          >
            {t("cancel")}
          </Button>
        )}
      </div>

      {verification.status === "rejected" && (
        <div className="flex items-center gap-3 text-sm mb-6 p-4 rounded-xl border border-destructive/20 bg-destructive/5">
          <div className="p-2 bg-destructive/10 rounded-full shrink-0">
            <XCircle className="h-4 w-4 text-destructive" />
          </div>
          <div className="text-start">
            <p className="font-semibold text-destructive">
              {t("request_rejected")}
            </p>
            {verification.rejectionReason && (
              <p className="text-muted-foreground text-xs mt-0.5">
                {t("reason")} {verification.rejectionReason}
              </p>
            )}
          </div>
        </div>
      )}

      {!isEditing ? (
        verification.status !== "rejected" && (
          <div className="text-center py-12 px-4 border-2 border-dashed rounded-2xl bg-muted/30">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <div className="p-4 bg-muted rounded-full">
                <IdCard className="h-8 w-8 opacity-80" />
              </div>
              <p className="font-medium text-foreground">{t("no_details")}</p>
              <p className="text-xs max-w-xs mx-auto text-muted-foreground">
                {t("no_details_desc")}
              </p>
            </div>
          </div>
        )
      ) : (
        <form
          onSubmit={(e) => e.preventDefault()}
          className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300"
        >
          {/* Document Type */}
          <div className="space-y-2 text-start">
            <Label className="text-sm font-medium">{t("doc_type")}</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDocType("national_id")}
                className={cn(
                  "rounded-4xl border p-3 text-sm font-medium transition-colors text-center",
                  docType === "national_id"
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:border-foreground/30",
                )}
              >
                {t("national_id")}
              </button>
              <button
                type="button"
                onClick={() => setDocType("passport")}
                className={cn(
                  "rounded-4xl border p-3 text-sm font-medium transition-colors text-center",
                  docType === "passport"
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:border-foreground/30",
                )}
              >
                {t("passport")}
              </button>
            </div>
          </div>

          {/* ID Number */}
          <div className="space-y-2 text-start">
            <Label htmlFor="idNumber" className="text-sm font-medium">
              {docType === "national_id"
                ? t("national_id_label")
                : t("passport_label")}
            </Label>
            <div className="relative group">
              <IdCard className="absolute start-3 top-2/4 -translate-y-2/4 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                id="idNumber"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                className="ps-9"
                placeholder={
                  docType === "national_id"
                    ? t("id_placeholder")
                    : t("passport_placeholder")
                }
                disabled={loading}
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2 text-start">
            <Label className="text-sm font-medium">{t("doc_image")}</Label>

            {preview ? (
              <div className="relative rounded-4xl border overflow-hidden max-w-[250px]">
                <img
                  src={preview}
                  alt="Document preview"
                  className="w-full max-h-48 object-contain bg-muted/30"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={clearFile}
                  className="absolute top-2 end-2"
                >
                  {t("remove")}
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="w-full rounded-4xl border-2 border-dashed border-muted-foreground/20 hover:border-muted-foreground/40 transition-colors p-8 flex flex-col items-center gap-2 text-muted-foreground"
              >
                <Upload className="h-5 w-5" />
                <span className="text-sm font-medium">{t("upload_image")}</span>
                <span className="text-xs">{t("image_limits")}</span>
              </button>
            )}

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileSelect}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !idNumber.trim() || !selectedFile}
              className="flex-1 sm:flex-none"
            >
              {loading ? t("submitting") : t("submit")}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
