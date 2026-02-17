"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

export default function BookingsPage() {
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
    router.push(`/hosting/bookings?${params.toString()}`, {
      scroll: false,
    });
  };

  const BookingSkeleton = () => (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Listing</TableHead>
            <TableHead>Guest</TableHead>
            <TableHead>Check In</TableHead>
            <TableHead>Check Out</TableHead>
            <TableHead>Guests</TableHead>
            <TableHead className="text-right">Total Price</TableHead>
          </TableRow>
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
              <TableCell className="text-right">
                <Skeleton className="h-4 w-[70px] ml-auto" />
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
        <h1 className="text-3xl font-bold">Bookings</h1>
        <p className="text-muted-foreground text-lg">
          Manage your property bookings
        </p>
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
              <Card>
                <CardContent className="text-center pt-6">
                  <p className="text-muted-foreground">No bookings found.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-md border bg-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Listing</TableHead>
                      <TableHead>Guest</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Guests</TableHead>
                      <TableHead className="text-right">Total Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow
                        key={booking._id}
                        className="hover:bg-muted/10 transition-colors"
                      >
                        <TableCell className="font-semibold text-primary">
                          {booking.listing?.title || "Unknown Listing"}
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
                          {booking.guests} guests
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          {booking.totalPrice} EGP
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
