"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/navigation";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Paginator } from "@/components/ui/paginator";
import { getHostBookings } from "@/services/bookings.service";
import type { Booking } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { StartChatButton } from "@/components/chat/StartChatButton";
import { useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/utils";

export default function BookingsPage() {
  const t = useTranslations("hosting");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const currentPage = Math.max(
    1,
    parseInt(searchParams.get("page") || "1", 10),
  );
  const limit = 10;

  const fetchBookings = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const data = await getHostBookings(pageNum, limit);
      setBookings(data.bookings);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings(currentPage);
  }, [currentPage, fetchBookings]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/hosting/bookings?${params.toString()}`, { scroll: false });
  };

  const TableHeadRow = () => (
    <TableRow className="bg-muted!">
      <TableHead>{t("col_listing")}</TableHead>
      <TableHead>{t("col_guest")}</TableHead>
      <TableHead>{t("col_check_in")}</TableHead>
      <TableHead>{t("col_check_out")}</TableHead>
      <TableHead>{t("col_guests")}</TableHead>
      <TableHead className="text-end">{t("col_total_price")}</TableHead>
      <TableHead className="w-[50px]"></TableHead>
    </TableRow>
  );

  const BookingSkeleton = () => (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableHeadRow />
        </TableHeader>
        <TableBody>
          {[...Array(10)].map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-[150px]" />
              </TableCell>
              <TableCell>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-3 w-[120px]" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-[80px]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-[80px]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-[60px]" />
              </TableCell>
              <TableCell className="text-end">
                <Skeleton className="h-4 w-[70px] ms-auto" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-8 rounded-md" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("bookings_title")}</h1>
        <p className="text-muted-foreground text-lg">{t("bookings_desc")}</p>
      </div>

      {loading && bookings.length === 0 ? (
        <BookingSkeleton />
      ) : (
        <div className="space-y-6">
          <div
            className={
              loading
                ? "opacity-50 pointer-events-none transition-opacity"
                : "transition-opacity"
            }
          >
            {bookings.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-xl">
                <p className="text-muted-foreground text-lg">
                  {t("no_bookings")}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border bg-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableHeadRow />
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking._id}>
                        <TableCell className="font-semibold text-primary">
                          {booking.listing?.title || t("unknown_listing")}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {booking.guest?.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {booking.guest?.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(booking.checkIn).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(booking.checkOut).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {t("guests_count", { count: booking.guests })}
                        </TableCell>
                        <TableCell className="text-end font-bold text-primary">
                          {formatCurrency(booking.totalPrice)}
                        </TableCell>
                        <TableCell>
                          {booking.status === "confirmed" && (
                            <StartChatButton
                              bookingId={booking._id}
                              isHost
                              iconOnly
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
    </div>
  );
}
