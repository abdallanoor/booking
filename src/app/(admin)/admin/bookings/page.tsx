"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Calendar, MapPin, Loader2, Eye } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAdminBookings } from "@/services/bookings.service";
import type { Booking } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AdminBookingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Read page & status from URL, with defaults
  const currentPage = Math.max(
    1,
    parseInt(searchParams.get("page") || "1", 10),
  );
  const statusFilter = searchParams.get("status") || "all";

  const fetchBookings = useCallback(async (pageNum: number, status: string) => {
    setLoading(true);
    try {
      const data = await getAdminBookings(
        pageNum,
        10,
        status === "all" ? undefined : status,
      );
      setBookings(data.bookings);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings(currentPage, statusFilter);
  }, [currentPage, statusFilter, fetchBookings]);

  const setStatusFilter = useCallback(
    (status: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("status", status);
      params.set("page", "1");
      router.push(`/admin/bookings?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/admin/bookings?${params.toString()}`, { scroll: false });
  };

  const BookingSkeleton = () => (
    <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted!">
            <TableHead className="w-[80px] px-6">Listing</TableHead>
            <TableHead>Guest & Stay</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total Price</TableHead>
            <TableHead className="text-right px-6">Actions</TableHead>
          </TableRow>
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
              <TableCell className="text-right px-6">
                <div className="flex justify-end py-2">
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
            Bookings Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and manage bookings across the platform.
          </p>
        </div>
        <div className="flex items-center justify-end gap-4 ms-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
              <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted!">
                      <TableHead className="w-[80px] px-6">Listing</TableHead>
                      <TableHead>Guest & Stay</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total Price</TableHead>
                      <TableHead className="text-right px-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No bookings found for this filter.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted!">
                        <TableHead className="w-[80px] px-6">Listing</TableHead>
                        <TableHead>Guest & Stay</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Total Price</TableHead>
                        <TableHead className="text-right px-6">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((booking) => (
                        <TableRow key={booking._id}>
                          <TableCell className="px-6">
                            <div className="relative h-12 w-20 overflow-hidden rounded-lg border bg-muted group">
                              {typeof booking.listing?.images?.[0] ===
                                "string" &&
                              booking.listing.images[0].trim() !== "" ? (
                                <Image
                                  src={booking.listing.images[0]}
                                  alt={booking.listing?.title || "Listing"}
                                  fill
                                  className="object-cover transition-transform group-hover:scale-110"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-muted">
                                  <MapPin className="h-6 w-6 text-muted-foreground opacity-30" />
                                </div>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span className="truncate max-w-[120px] sm:max-w-[200px] md:max-w-none font-bold">
                                {booking.listing?.title || "Unknown Listing"}
                              </span>

                              <div className="flex items-center text-sm">
                                <Avatar className="h-5 w-5 mr-1.5">
                                  <AvatarImage src={booking.guest?.avatar} />
                                  <AvatarFallback className="text-[10px]">
                                    {booking.guest?.name
                                      ?.charAt(0)
                                      .toUpperCase() || "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-muted-foreground text-xs">
                                  {booking.guest?.name || "Unknown Guest"}
                                </span>
                              </div>

                              <div className="flex items-center text-xs text-muted-foreground font-medium">
                                <Calendar className="mr-1.5 h-3 w-3" />
                                {formatDate(booking.checkIn, "short")} -{" "}
                                {formatDate(booking.checkOut, "short")}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant={
                                booking.status === "confirmed"
                                  ? "default"
                                  : booking.status === "cancelled"
                                    ? "destructive"
                                    : "secondary"
                              }
                              className="capitalize text-[10px] sm:text-xs font-semibold px-2.5 py-0.5"
                            >
                              {booking.status}
                            </Badge>
                          </TableCell>

                          <TableCell className="whitespace-nowrap font-bold text-primary">
                            {formatCurrency(booking.totalPrice)}
                          </TableCell>

                          <TableCell className="text-right px-6">
                            <div className="flex items-center justify-end py-2">
                              {booking.listing && (
                                <Link
                                  href={`/listings/${booking.listing._id}`}
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
                              )}
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
    </div>
  );
}
