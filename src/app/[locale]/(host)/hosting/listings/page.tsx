"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/navigation";
import Image from "next/image";
import { Link } from "@/navigation";
import { toast } from "sonner";
import {
  Trash2,
  Loader2,
  Edit,
  HousePlus,
  Eye,
  MessageCircleQuestion,
  Calendar,
} from "lucide-react";
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
import { deleteListing, getHostListings } from "@/services/listings.service";
import type { Listing } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { useTranslations } from "next-intl";

export default function ListingsPage() {
  const t = useTranslations("hosting");
  const tAdmin = useTranslations("admin");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const currentPage = Math.max(
    1,
    parseInt(searchParams.get("page") || "1", 10),
  );
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchListings = useCallback(
    async (pageNum: number) => {
      setLoading(true);
      try {
        const data = await getHostListings(pageNum, 5);
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
    fetchListings(currentPage);
  }, [currentPage, fetchListings]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/hosting/listings?${params.toString()}`, { scroll: false });
  };

  const handleDelete = async (id: string) => {
    setProcessingId(id);
    try {
      await deleteListing(id);
      setListings((prev) => prev.filter((p) => p._id !== id));
      toast.success(t("listing_deleted"));
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("failed_load_listings");
      toast.error(message);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusLabel = (status: string | undefined) => {
    if (status === "approved") return tAdmin("status_approved");
    if (status === "rejected") return tAdmin("status_rejected");
    return tAdmin("status_pending");
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
                <Skeleton className="h-12 w-16 rounded-md" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-[200px]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-[80px] rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-[60px]" />
              </TableCell>
              <TableCell className="text-end px-6">
                <div className="flex justify-end gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("listings_title")}
          </h1>
          <p className="text-muted-foreground text-lg">{t("listings_desc")}</p>
        </div>
        <Link href="/hosting/listings/new">
          <Button size="lg">
            <HousePlus /> {t("add_listing")}
          </Button>
        </Link>
      </div>

      {loading && listings.length === 0 ? (
        <ListingSkeleton />
      ) : (
        <div
          className={
            loading
              ? "opacity-50 pointer-events-none transition-opacity"
              : "transition-opacity"
          }
        >
          {listings.length === 0 && !loading ? (
            <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/5">
              <p className="text-muted-foreground mb-4 text-lg">
                {t("no_listings")}
              </p>
              <Link href="/hosting/listings/new">
                <Button variant="outline" className="rounded-full">
                  {t("create_first")}
                </Button>
              </Link>
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
                              src={listing.images[0]}
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
                            <span className="text-xs text-muted-foreground font-medium">
                              {listing.location.city}
                            </span>
                            {listing.status === "rejected" &&
                              listing.rejectionReason && (
                                <span className="text-xs text-red-500 font-medium mt-1">
                                  {t("rejection_reason")}{" "}
                                  {listing.rejectionReason}
                                </span>
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
                            {getStatusLabel(listing.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-bold text-primary">
                          {formatCurrency(listing.pricePerNight)}
                        </TableCell>
                        <TableCell className="text-end px-6">
                          <div className="grid grid-cols-2 lg:flex lg:flex-row items-center justify-end gap-2.5 min-w-20 py-2">
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

                            {/* Questions */}
                            <Link
                              href={`/hosting/listings/${listing._id}/questions`}
                            >
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-10 w-10 rounded-full bg-purple-100/50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/50 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-500/20 dark:hover:text-purple-300 dark:hover:border-purple-400/50 hover:scale-110 transition-all duration-200"
                                title="Questions"
                              >
                                <MessageCircleQuestion />
                              </Button>
                            </Link>

                            {/* Calendar */}
                            <Link
                              href={`/hosting/listings/${listing._id}/calendar`}
                            >
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-10 w-10 rounded-full bg-orange-100/50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border border-orange-200/50 dark:border-orange-800/50 hover:bg-orange-600 hover:text-white dark:hover:bg-orange-500/20 dark:hover:text-orange-300 dark:hover:border-orange-400/50 hover:scale-110 transition-all duration-200"
                                title="Calendar"
                              >
                                <Calendar />
                              </Button>
                            </Link>

                            {/* Edit */}
                            <Link
                              href={`/hosting/listings/${listing._id}/edit`}
                            >
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-10 w-10 rounded-full bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500/20 dark:hover:text-emerald-300 dark:hover:border-emerald-400/50 hover:scale-110 transition-all duration-200"
                                title="Edit"
                              >
                                <Edit />
                              </Button>
                            </Link>

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
                                  {processingId === listing._id ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
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
                                    onClick={() => handleDelete(listing._id)}
                                    className="bg-red-600 hover:bg-red-700 text-white"
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
      )}

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
  );
}
