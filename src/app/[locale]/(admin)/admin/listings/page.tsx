"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/navigation";
import Image from "next/image";
import { Link } from "@/navigation";
import { toast } from "sonner";
import { Check, X, Trash2, Loader2, Eye, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Paginator } from "@/components/ui/paginator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  updateListingStatus,
  deleteListing,
  getAdminListings,
} from "@/services/listings.service";
import type { Listing } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { useTranslations, useLocale } from "next-intl";

export default function AdminListingsPage() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const currentPage = Math.max(
    1,
    parseInt(searchParams.get("page") || "1", 10),
  );
  const statusFilter = searchParams.get("status") || "pending";

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<
    "approve" | "reject" | "delete" | null
  >(null);

  const [rejectReason, setRejectReason] = useState("");
  const [listingToReject, setListingToReject] = useState<string | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const fetchListings = useCallback(
    async (pageNum: number, status: string) => {
      setLoading(true);
      try {
        const data = await getAdminListings(
          pageNum,
          5,
          status === "all" ? undefined : status,
        );
        setListings(data.listings);
        setPagination(data.pagination);
      } catch (error) {
        console.error("Failed to fetch listings:", error);
        toast.error(t("failed_load_listings"));
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    fetchListings(currentPage, statusFilter);
  }, [currentPage, statusFilter, fetchListings]);

  const setStatusFilter = useCallback(
    (status: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("status", status);
      params.set("page", "1");
      router.push(`/admin/listings?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/admin/listings?${params.toString()}`, { scroll: false });
  };

  const handleAction = async (id: string, action: "approve" | "delete") => {
    setProcessingId(id);
    setProcessingAction(action);
    try {
      if (action === "delete") {
        await deleteListing(id);
        setListings((prev) => prev.filter((p) => p._id !== id));
        toast.success(t("listing_deleted"));
      } else {
        await updateListingStatus(id, "approved");
        setListings((prev) => prev.filter((p) => p._id !== id));
        toast.success(t("listing_approved"));
      }
      fetchListings(currentPage, statusFilter);
    } catch {
      toast.error(t("action_failed"));
    } finally {
      setProcessingId(null);
      setProcessingAction(null);
    }
  };

  const handleReject = async () => {
    if (!listingToReject || !rejectReason.trim()) return;
    setProcessingId(listingToReject);
    setProcessingAction("reject");
    setIsRejectDialogOpen(false);

    try {
      await updateListingStatus(listingToReject, "rejected", rejectReason);
      setListings((prev) => prev.filter((p) => p._id !== listingToReject));
      toast.success(t("listing_rejected"));
      fetchListings(currentPage, statusFilter);
    } catch {
      toast.error(t("failed_reject"));
    } finally {
      setProcessingId(null);
      setProcessingAction(null);
      setListingToReject(null);
      setRejectReason("");
    }
  };

  const TableHeadRow = () => (
    <TableRow className="bg-muted!">
      <TableHead className="w-[80px] px-6">{t("col_listing")}</TableHead>
      <TableHead>{t("col_title")}</TableHead>
      <TableHead>{t("col_status")}</TableHead>
      <TableHead>{t("col_price_night")}</TableHead>
      <TableHead className="text-end px-6">{t("col_actions")}</TableHead>
    </TableRow>
  );

  const ListingSkeleton = () => (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableHeadRow />
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell className="px-6">
                <Skeleton className="h-12 w-20 rounded-lg" />
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-3 w-[120px]" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-[70px] rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-[80px]" />
              </TableCell>
              <TableCell className="text-end px-6">
                <div className="flex justify-end gap-2.5 min-w-20 py-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center flex-wrap gap-4 justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("listings_title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("listings_desc")}</p>
        </div>
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

      {loading && listings.length === 0 ? (
        <ListingSkeleton />
      ) : (
        <div className="space-y-6">
          <div
            className={
              loading
                ? "opacity-50 pointer-events-none transition-opacity"
                : "transition-opacity"
            }
          >
            {listings.length === 0 ? (
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
                        {t("no_listings")}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="rounded-2xl border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableHeadRow />
                    </TableHeader>
                    <TableBody>
                      {listings.map((listing) => (
                        <TableRow key={listing._id}>
                          <TableCell className="px-6">
                            <div className="relative h-12 w-20 overflow-hidden rounded-lg border bg-muted group">
                              <Image
                                src={listing.images?.[0]}
                                alt={listing.title}
                                fill
                                className="object-cover transition-transform group-hover:scale-110"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span className="truncate max-w-[120px] sm:max-w-[200px] md:max-w-none font-bold">
                                {listing.title}
                              </span>
                              <div className="flex items-center text-xs text-muted-foreground font-medium mt-1">
                                <MapPin className="me-1 h-3 w-3" />
                                {listing.location.city},{" "}
                                {listing.location.country}
                              </div>
                              {listing.rejectionReason &&
                                listing.status !== "approved" && (
                                  <div className="text-xs text-orange-500 font-medium mt-1 whitespace-normal wrap-break-word max-w-[200px] md:max-w-[300px] xl:max-w-[400px]">
                                    {t("previous_rejection")}{" "}
                                    {listing.rejectionReason}
                                  </div>
                                )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                listing.status === "approved"
                                  ? "default"
                                  : listing.status === "rejected"
                                    ? "destructive"
                                    : "secondary"
                              }
                              className="capitalize text-[10px] sm:text-xs font-semibold px-2.5 py-0.5"
                            >
                              {listing.status === "approved"
                                ? t("status_approved")
                                : listing.status === "rejected"
                                  ? t("status_rejected")
                                  : t("status_pending")}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap font-bold text-primary">
                            {formatCurrency(listing.pricePerNight)}
                          </TableCell>
                          <TableCell className="text-end px-6">
                            <div className="flex items-center justify-end gap-2.5 min-w-20 py-2">
                              {/* View */}
                              <Link
                                href={`/listings/${listing._id}`}
                                target="_blank"
                              >
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-10 w-10 rounded-full bg-blue-100/50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500/20 dark:hover:text-blue-300 dark:hover:border-blue-400/50 hover:scale-110 transition-all duration-200"
                                  title="View"
                                >
                                  <Eye />
                                </Button>
                              </Link>

                              {listing.status === "pending" && (
                                <>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() =>
                                      handleAction(listing._id, "approve")
                                    }
                                    disabled={processingId === listing._id}
                                    className="h-10 w-10 rounded-full bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500/20 dark:hover:text-emerald-300 dark:hover:border-emerald-400/50 hover:scale-110 transition-all duration-200"
                                    title="Approve"
                                  >
                                    {processingId === listing._id &&
                                    processingAction === "approve" ? (
                                      <Loader2 className="animate-spin" />
                                    ) : (
                                      <Check />
                                    )}
                                  </Button>

                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => {
                                      setListingToReject(listing._id);
                                      setRejectReason("");
                                      setIsRejectDialogOpen(true);
                                    }}
                                    disabled={processingId === listing._id}
                                    className="h-10 w-10 rounded-full bg-orange-100/50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border border-orange-200/50 dark:border-orange-800/50 hover:bg-orange-600 hover:text-white dark:hover:bg-orange-500/20 dark:hover:text-orange-300 dark:hover:border-orange-400/50 hover:scale-110 transition-all duration-200"
                                    title="Reject"
                                  >
                                    {processingId === listing._id &&
                                    processingAction === "reject" ? (
                                      <Loader2 className="animate-spin" />
                                    ) : (
                                      <X />
                                    )}
                                  </Button>
                                </>
                              )}

                              {/* Delete */}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-10 w-10 rounded-full bg-red-100/50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-800/50 hover:bg-red-600 hover:text-white dark:hover:bg-red-500/20 dark:hover:text-red-300 dark:hover:border-red-400/50 hover:scale-110 transition-all duration-200 disabled:opacity-50"
                                    disabled={processingId === listing._id}
                                    title="Delete"
                                  >
                                    {processingId === listing._id &&
                                    processingAction === "delete" ? (
                                      <Loader2 className="animate-spin" />
                                    ) : (
                                      <Trash2 />
                                    )}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      {t("confirm_delete_title")}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t("confirm_delete_desc")}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      {t("cancel")}
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        handleAction(listing._id, "delete")
                                      }
                                      variant="destructive"
                                    >
                                      {t("delete_listing")}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="mt-8 flex justify-center">
              <Paginator
                currentPage={currentPage}
                totalPages={pagination.pages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      )}
      <AlertDialog
        open={isRejectDialogOpen}
        onOpenChange={setIsRejectDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("reject_listing_title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("reject_listing_desc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              placeholder={t("rejection_reason_placeholder")}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setListingToReject(null);
                setRejectReason("");
              }}
            >
              {t("cancel")}
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim()}
            >
              {t("reject_listing_btn")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
