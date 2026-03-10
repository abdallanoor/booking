"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/navigation";
import { apiClient } from "@/lib/api-client";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, CheckCircle, XCircle, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/navigation";
import { formatDate } from "@/lib/utils";
import { Paginator } from "@/components/ui/paginator";
import { useTranslations, useLocale } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";

type VerificationRequest = {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  type: "national_id" | "passport";
  idNumber: string;
  imageUrl: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  createdAt: string;
};

const ITEMS_PER_PAGE = 10;

export default function VerificationsPage() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPage = Math.max(
    1,
    parseInt(searchParams.get("page") || "1", 10),
  );
  const statusFilter = searchParams.get("status") || "pending";

  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [previewVerification, setPreviewVerification] =
    useState<VerificationRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  const updateSearchParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        params.set(key, value);
      });
      router.push(`/admin/verifications?${params.toString()}`, {
        scroll: false,
      });
    },
    [searchParams, router],
  );

  const setCurrentPage = useCallback(
    (page: number) => {
      updateSearchParams({ page: String(page) });
    },
    [updateSearchParams],
  );

  const setStatusFilter = useCallback(
    (status: string) => {
      const params = new URLSearchParams();
      params.set("status", status);
      params.set("page", "1");
      router.push(`/admin/verifications?${params.toString()}`, {
        scroll: false,
      });
    },
    [router],
  );

  const fetchVerifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("page", String(currentPage));
      params.set("limit", String(ITEMS_PER_PAGE));
      const data = await apiClient.get<{
        data: {
          verifications: VerificationRequest[];
          totalPages: number;
          totalCount: number;
          currentPage: number;
        };
      }>(`/admin/identity-verifications?${params.toString()}`);
      setVerifications(data.data.verifications);
      setTotalPages(data.data.totalPages);
    } catch {
      toast.error(t("failed_load_verifications"));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, currentPage, t]);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await apiClient.patch(`/admin/identity-verifications/${id}`, {
        action: "approve",
      });
      toast.success(t("approved_success"));
      setVerifications((prev) => prev.filter((v) => v._id !== id));
    } catch {
      toast.error(t("failed_approve"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectionReason.trim()) {
      toast.error(t("reason_required"));
      return;
    }

    setActionLoading(id);
    try {
      await apiClient.patch(`/admin/identity-verifications/${id}`, {
        action: "reject",
        rejectionReason,
      });
      toast.success(t("rejected_success"));
      setVerifications((prev) => prev.filter((v) => v._id !== id));
      setRejectingId(null);
      setRejectionReason("");
    } catch {
      toast.error(t("failed_reject_verification"));
    } finally {
      setActionLoading(null);
    }
  };

  const TableHeadRow = () => (
    <TableRow className="bg-muted/50">
      <TableHead className="w-[250px]">{t("col_user")}</TableHead>
      <TableHead>{t("col_image")}</TableHead>
      <TableHead>{t("col_document")}</TableHead>
      <TableHead>{t("col_status")}</TableHead>
      <TableHead className="text-end">{t("col_actions")}</TableHead>
    </TableRow>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center flex-wrap gap-4 justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="secondary" size="icon" className="rounded-full">
              <ChevronLeft className="rtl:rotate-180" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {t("verifications_title")}
            </h1>
            <p className="text-muted-foreground">{t("verifications_desc")}</p>
          </div>
        </div>
        {/* Filter */}
        <div className="flex items-center justify-end gap-4 ms-auto">
          {loading ? (
            <Skeleton className="h-9 w-40 rounded-full" />
          ) : (
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
              dir={locale === "ar" ? "rtl" : "ltr"}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t("filter_status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all")}</SelectItem>
                <SelectItem value="pending">{t("pending")}</SelectItem>
                <SelectItem value="approved">{t("approved")}</SelectItem>
                <SelectItem value="rejected">{t("rejected")}</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Table */}
      {loading && verifications.length === 0 ? (
        <div className="rounded-2xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableHeadRow />
            </TableHeader>
            <TableBody>
              {Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-3.5 w-24 bg-muted animate-pulse rounded" />
                        <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="h-12 w-18 bg-muted animate-pulse rounded-md" />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <div className="h-5 w-20 bg-muted animate-pulse rounded-full" />
                      <div className="h-3.5 w-28 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="h-5 w-16 bg-muted animate-pulse rounded-full" />
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex items-center gap-2 justify-end">
                      <div className="h-8 w-20 bg-muted animate-pulse rounded-md" />
                      <div className="h-8 w-16 bg-muted animate-pulse rounded-md" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="space-y-6">
          <div
            className={
              loading
                ? "opacity-50 pointer-events-none transition-opacity"
                : "transition-opacity"
            }
          >
            {verifications.length === 0 ? (
              <div className="rounded-2xl border bg-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableHeadRow />
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-24 text-center text-muted-foreground"
                      >
                        {t("no_verifications")}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="rounded-2xl border bg-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableHeadRow />
                  </TableHeader>
                  <TableBody>
                    {verifications.map((v) => (
                      <TableRow
                        key={v._id}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border">
                              <AvatarImage src={v.user.avatar} />
                              <AvatarFallback className="bg-primary/5 text-primary text-xs">
                                {v.user.name?.charAt(0).toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">
                                {v.user.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {v.user.email}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => {
                              setPreviewVerification(v);
                              setDialogOpen(true);
                            }}
                            className="relative h-12 w-18 rounded-md overflow-hidden border hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer group"
                          >
                            <div className="absolute inset-0 bg-muted animate-pulse" />
                            <Image
                              src={v.imageUrl}
                              alt={t("id_doc_alt")}
                              fill
                              className="object-cover relative z-10"
                              loading="lazy"
                              onLoad={(e) => {
                                const prev = e.currentTarget
                                  .previousElementSibling as HTMLElement;
                                if (prev) prev.style.display = "none";
                              }}
                            />
                          </button>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge
                              variant="outline"
                              className="bg-muted/50 text-muted-foreground border-muted-foreground/10"
                            >
                              {v.type === "national_id"
                                ? t("national_id")
                                : t("passport")}
                            </Badge>
                            <p className="text-sm font-mono">{v.idNumber}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(v.createdAt)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              v.status === "approved"
                                ? "default"
                                : v.status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="capitalize"
                          >
                            {v.status === "approved"
                              ? t("status_approved")
                              : v.status === "rejected"
                                ? t("status_rejected")
                                : t("status_pending")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-end">
                          {v.status === "pending" && (
                            <>
                              {rejectingId === v._id ? (
                                <div className="flex items-center gap-2 justify-end">
                                  <Input
                                    placeholder={t("reason_placeholder")}
                                    value={rejectionReason}
                                    onChange={(e) =>
                                      setRejectionReason(e.target.value)
                                    }
                                    className="max-w-[180px] h-8 text-sm"
                                  />
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleReject(v._id)}
                                    disabled={actionLoading === v._id}
                                  >
                                    {actionLoading === v._id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      t("confirm")
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setRejectingId(null);
                                      setRejectionReason("");
                                    }}
                                  >
                                    {t("cancel")}
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 justify-end">
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleApprove(v._id)}
                                    disabled={actionLoading === v._id}
                                  >
                                    {actionLoading === v._id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <>
                                        <CheckCircle className="h-3.5 w-3.5" />
                                        {t("approve")}
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setRejectingId(v._id)}
                                    disabled={actionLoading === v._id}
                                  >
                                    <XCircle className="h-3.5 w-3.5" />
                                    {t("reject")}
                                  </Button>
                                </div>
                              )}
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <Paginator
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      )}

      {/* Full-size Image Preview Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDialogOpen(false);
            setTimeout(() => setPreviewVerification(null), 200);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("id_preview_title")}</DialogTitle>
          </DialogHeader>
          {previewVerification && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Badge
                  variant="outline"
                  className="bg-muted/50 text-muted-foreground border-muted-foreground/10"
                >
                  {previewVerification.type === "national_id"
                    ? t("national_id")
                    : t("passport")}
                </Badge>
                <span className="font-mono font-medium">
                  {previewVerification.idNumber}
                </span>
              </div>
              <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden border">
                <div className="absolute inset-0 bg-muted animate-pulse" />
                <Image
                  src={previewVerification.imageUrl}
                  alt={t("id_doc_preview_alt")}
                  fill
                  className="object-cover relative z-10"
                  loading="lazy"
                  onLoad={(e) => {
                    const prev = e.currentTarget
                      .previousElementSibling as HTMLElement;
                    if (prev) prev.style.display = "none";
                  }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
