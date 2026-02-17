"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
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
  onVerified,
}: IdentityVerificationProps) {
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

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
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
      toast.error("Please fill in all fields and upload an image");
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
        toast.success("Verification request submitted!");
        setVerification({
          status: "pending",
          type: docType,
          idNumber: idNumber.trim(),
        });
        clearFile();
        setIdNumber("");
      } else {
        toast.error(result.message || "Failed to submit");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="p-6 md:p-10 border-t border-border animate-pulse">
        <div className="mb-8 space-y-2">
          <div className="h-6 w-48 bg-muted rounded-md" />
          <div className="h-4 w-64 bg-muted/60 rounded-md" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-40 bg-muted/60 rounded-md" />
          <div className="h-10 w-full bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  // ── Verified ──
  if (verification.status === "approved") {
    return (
      <div className="p-6 md:p-10 border-t border-border">
        <div className="mb-8">
          <h3 className="text-xl font-bold text-foreground">
            Identity Verification
          </h3>
          <p className="text-sm text-muted-foreground">
            Your identity has been verified.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              National ID / Passport Number
            </Label>
            <div className="flex items-center gap-1 text-xs font-bold text-green-600 px-1.5 py-0.5 tracking-tight">
              <CheckCircle2 className="h-3 w-3" />
              Verified
            </div>
          </div>
          <div className="relative group">
            <IdCard className="absolute left-3 top-2/4 -translate-y-2/4 h-4 w-4 text-muted-foreground" />
            <Input
              value={nationalId || verification.idNumber || ""}
              readOnly
              disabled
              className="pl-9 bg-secondary/5 border-dashed border-muted-foreground/20 cursor-not-allowed"
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Pending ──
  if (verification.status === "pending") {
    return (
      <div className="p-6 md:p-10 border-t border-border">
        <div className="mb-8">
          <h3 className="text-xl font-bold text-foreground">
            Identity Verification
          </h3>
          <p className="text-sm text-muted-foreground">
            Your document is under review.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              {verification.type === "national_id"
                ? "National ID Number"
                : "Passport Number"}
            </Label>
            <div className="flex items-center gap-1 text-xs font-bold text-amber-600 px-1.5 py-0.5 tracking-tight">
              <Clock className="h-3 w-3" />
              Pending
            </div>
          </div>
          <div className="relative group">
            <IdCard className="absolute left-3 top-2/4 -translate-y-2/4 h-4 w-4 text-muted-foreground" />
            <Input
              value={verification.idNumber || ""}
              readOnly
              disabled
              className="pl-9 bg-secondary/5 border-dashed border-muted-foreground/20 cursor-not-allowed"
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Form (new / rejected) ──
  return (
    <div className="p-6 md:p-10 border-t border-border">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-foreground">
            Identity Verification
          </h3>
          <p className="text-sm text-muted-foreground">
            {verification.status === "rejected"
              ? "Update your ID or passport information."
              : "Submit your ID or passport for verification."}
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
                <span className="max-sm:hidden">Update Details</span>
              </>
            ) : (
              <>
                <Plus />
                <span className="max-sm:hidden">Add Details</span>
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
            Cancel
          </Button>
        )}
      </div>

      {verification.status === "rejected" && (
        <div className="flex items-center gap-3 text-sm mb-6 p-4 rounded-xl border border-destructive/20 bg-destructive/5">
          <div className="p-2 bg-destructive/10 rounded-full shrink-0">
            <XCircle className="h-4 w-4 text-destructive" />
          </div>
          <div>
            <p className="font-semibold text-destructive">Request Rejected</p>
            {verification.rejectionReason && (
              <p className="text-muted-foreground text-xs mt-0.5">
                Reason: {verification.rejectionReason}
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
              <p className="font-medium text-foreground">
                No identity details provided
              </p>
              <p className="text-xs max-w-xs mx-auto text-muted-foreground">
                A valid ID or passport is required to verify your identity.
              </p>
            </div>
          </div>
        )
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          {/* Document Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Document Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDocType("national_id")}
                className={cn(
                  "rounded-lg border p-3 text-sm font-medium transition-colors text-center",
                  docType === "national_id"
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:border-foreground/30",
                )}
              >
                National ID
              </button>
              <button
                type="button"
                onClick={() => setDocType("passport")}
                className={cn(
                  "rounded-lg border p-3 text-sm font-medium transition-colors text-center",
                  docType === "passport"
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:border-foreground/30",
                )}
              >
                Passport
              </button>
            </div>
          </div>

          {/* ID Number */}
          <div className="space-y-2">
            <Label htmlFor="idNumber" className="text-sm font-medium">
              {docType === "national_id"
                ? "National ID Number"
                : "Passport Number"}
            </Label>
            <div className="relative group">
              <IdCard className="absolute left-3 top-2/4 -translate-y-2/4 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                id="idNumber"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                className="pl-9"
                placeholder={
                  docType === "national_id"
                    ? "e.g. 29901011234567"
                    : "e.g. A12345678"
                }
                disabled={loading}
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Document Image</Label>

            {preview ? (
              <div className="relative rounded-lg border overflow-hidden max-w-[250px]">
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
                  className="absolute top-2 right-2"
                >
                  Remove
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="w-full rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-muted-foreground/40 transition-colors p-8 flex flex-col items-center gap-2 text-muted-foreground"
              >
                <Upload className="h-5 w-5" />
                <span className="text-sm font-medium">
                  Upload document image
                </span>
                <span className="text-xs">PNG, JPG up to 5MB</span>
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
              {loading ? "Submitting..." : "Submit for Verification"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
