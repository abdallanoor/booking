"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import Image from "next/image";
import {
  Loader2,
  MapPin,
  Calendar,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaymentDetails } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [pollCount, setPollCount] = useState(0);

  const bookingId = searchParams.get("bookingId");
  const success = searchParams.get("success");

  const fetchPaymentStatus = useCallback(async () => {
    if (!bookingId) {
      setLoading(false);
      return;
    }

    try {
      // First, try to get the booking to find the payment
      const bookingResponse = await apiClient.get<
        ApiResponse<{ booking: { paymentId: string } }>
      >(`/bookings/${bookingId}`);

      if (bookingResponse.success && bookingResponse.data.booking?.paymentId) {
        const paymentId = bookingResponse.data.booking.paymentId;
        const paymentResponse = await apiClient.get<
          ApiResponse<{ payment: PaymentDetails }>
        >(`/payments/${paymentId}`);

        if (paymentResponse.success) {
          setPaymentDetails(paymentResponse.data.payment);

          // If payment is still pending and we haven't polled too many times, poll again
          if (
            paymentResponse.data.payment.status === "pending" &&
            pollCount < 10
          ) {
            setTimeout(() => {
              setPollCount((prev) => prev + 1);
            }, 2000); // Poll every 2 seconds
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching payment status:", error);
      setLoading(false);
    }
  }, [bookingId, pollCount]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (isMounted) await fetchPaymentStatus();
    })();
    return () => {
      isMounted = false;
    };
  }, [fetchPaymentStatus]);

  // const formatTime = (dateStr: string) => {
  //   // Assuming checkin/out might have times, if not we can default to standard checkin times
  //   // For now just returning empty or specific strings if needed.
  //   // In a real app these usually come from the listing policies.
  //   return "12:00 PM";
  // };

  // Loading State with Skeleton
  if (loading) {
    return (
      <div className="container py-8 md:py-12 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-16 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-64 w-full rounded-2xl" />
              <div className="rounded-2xl border p-8 space-y-6">
                <Skeleton className="h-8 w-40" />
                <div className="flex justify-between">
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-32" />
                </div>
                <div className="pt-6 border-t space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="space-y-6">
              <Skeleton className="h-96 w-full rounded-3xl" />
              <Skeleton className="h-20 w-full rounded-3xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (!bookingId || (!loading && !paymentDetails && !success)) {
    // Handling case where paymentDetails is null but success param might be missing or false
    // Or just general error state
    return (
      <div className="container py-8 text-center">
        <div className="mb-6 flex justify-center">
          <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-red-600 text-3xl">!</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-4">
          We couldn&apos;t find your booking
        </h1>
        <p className="text-muted-foreground mb-8">
          Something went wrong while retrieving your booking details. Please
          checks your email for confirmation or contact support.
        </p>
        <Button onClick={() => router.push("/")} size="lg">
          Go Home
        </Button>
      </div>
    );
  }

  const isSuccess = paymentDetails?.status === "paid" || success === "true";
  const listing = paymentDetails?.booking?.listing;
  const booking = paymentDetails?.booking;

  // Render Content
  return (
    <div className="container py-8 md:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* LEFT COLUMN: Confirmation Details */}
        <div className="lg:col-span-2 space-y-10">
          {/* Header */}
          <div className="space-y-6">
            {isSuccess ? (
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-muted text-xs font-bold uppercase">
                  Reservation Confirmed
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-foreground tracking-tight leading-tight">
                  You&apos;re going to{" "}
                  <span className="text-primary italic">
                    {listing?.location.city || "your destination"}
                  </span>
                  !
                </h1>
                <p className="text-muted-foreground text-lg md:text-xl max-w-xl">
                  Get ready for your trip. Your booking details are listed
                  below.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <h1 className="text-3xl font-bold text-red-600">
                  Payment Failed
                </h1>
                <p className="text-muted-foreground text-lg">
                  We couldn&apos;t process your payment. Please try again.
                </p>
              </div>
            )}
          </div>

          {isSuccess && booking && (
            <div className="space-y-8">
              {/* Mobile Only: Hero Image & Title */}
              <div className="lg:hidden relative">
                <div className="relative h-64 w-full rounded-2xl overflow-hidden shadow-md">
                  {listing?.images?.[0] ? (
                    <Image
                      src={listing.images[0]}
                      alt={listing.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-muted text-muted-foreground">
                      No Image
                    </div>
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                    <h3 className="text-white text-xl font-bold">
                      {listing?.title}
                    </h3>
                    <p className="text-white/80 text-sm flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-primary" />
                      {listing?.location.city}, {listing?.location.country}
                    </p>
                  </div>
                </div>
              </div>

              {/* Booking Details Section */}
              <div className="grid grid-cols-1 gap-6">
                {/* Mobile Only Extra Info - Hidden on Desktop to avoid repetition */}
                <div className="lg:hidden grid grid-cols-1 gap-4">
                  <div className="bg-muted/30 p-5 rounded-2xl space-y-3 border border-border/50">
                    <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-widest">
                      <Calendar className="w-4 h-4" />
                      <span>Stay Dates</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-semibold">
                      <span>{formatDate(booking.checkIn, "fullDate")}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                      <span>{formatDate(booking.checkOut, "fullDate")}</span>
                    </div>
                  </div>
                </div>

                {/* Shared: Payment & Confirmation Details */}
                <div className="rounded-3xl border border-border/60 bg-card overflow-hidden shadow-sm">
                  <div className="bg-muted/30 px-6 py-5 border-b border-border/60">
                    <h3 className="font-bold flex items-center gap-2 text-foreground">
                      <CreditCard className="w-5 h-5 text-primary" />
                      Payment Receipt
                    </h3>
                  </div>
                  <div className="p-6 md:p-8 space-y-8">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6 md:gap-0">
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black">
                          Booking Reference
                        </p>
                        <p className="font-mono font-bold text-2xl text-foreground">
                          {booking._id.slice(-8).toUpperCase()}
                        </p>
                      </div>
                      <div className="md:text-right space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black">
                          Total Amount Paid
                        </p>
                        <p className="text-3xl font-black text-primary">
                          {formatCurrency(paymentDetails.amount, true)}
                        </p>
                      </div>
                    </div>

                    <div className="pt-8 border-t border-dashed border-border/80 space-y-5">
                      {paymentDetails.paidAt && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground font-medium">
                            Transaction Date
                          </span>
                          <span className="font-bold text-foreground">
                            {formatDate(paymentDetails.paidAt, "dateTime")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Helpful Info / Next Steps */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 space-y-3">
                    <h4 className="font-bold text-primary flex items-center gap-2 text-sm uppercase tracking-wider">
                      Next Steps
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Check your inbox for a confirmation email. It contains
                      your entry codes and check-in instructions.
                    </p>
                  </div>
                  <div className="p-6 rounded-3xl bg-muted/20 border border-border/50 space-y-3">
                    <h4 className="font-bold flex items-center gap-2 text-foreground text-sm uppercase tracking-wider">
                      Guest Support
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Have questions? Our support team is available 24/7 to
                      assist you with your upcoming stay.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  size="lg"
                  className="px-10 h-16 text-base font-bold"
                  onClick={() => router.push("/bookings")}
                >
                  View My Bookings
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="px-10 h-16 text-base font-semibold"
                  onClick={() => router.push("/")}
                >
                  Back to Home
                </Button>
              </div>
            </div>
          )}

          {!isSuccess && (
            <div className="flex flex-col gap-4">
              <Button
                size="lg"
                onClick={() => router.push(`/listings/${bookingId}`)}
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push("/")}
              >
                Go Home
              </Button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Summary Card (Desktop) */}
        {isSuccess && booking && (
          <div className="hidden lg:block">
            <div className="space-y-6">
              <Card className="rounded-3xl overflow-hidden border-none ring-1 ring-black/5 pt-0!">
                <div className="relative h-56 w-full">
                  {listing?.images?.[0] ? (
                    <Image
                      src={listing.images[0]}
                      alt={listing.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-muted text-muted-foreground">
                      No Image Available
                    </div>
                  )}
                </div>

                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-black leading-tight mb-2 tracking-tight text-foreground">
                        {listing?.title}
                      </h2>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="p-1 rounded bg-primary/10">
                          <MapPin className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="text-sm font-semibold">
                          {listing?.location.city}, {listing?.location.country}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-6 border-y border-border/60">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">
                          Check-in
                        </p>
                        <p className="text-sm font-bold text-foreground">
                          {formatDate(booking.checkIn, "fullDate")}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">
                          Check-out
                        </p>
                        <p className="text-sm font-bold text-foreground">
                          {formatDate(booking.checkOut, "fullDate")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-foreground">
                          Total Price
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                          All taxes included
                        </p>
                      </div>
                      <p className="text-2xl font-black text-foreground">
                        {formatCurrency(paymentDetails.amount, true)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="p-6 rounded-3xl bg-linear-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10 shadow-sm">
                <p className="text-sm font-black text-center mb-1 text-primary">
                  BOOKING SECURED
                </p>
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  Your reservation is confirmed. We look forward to hosting you
                  soon!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      }
    >
      <PaymentResultContent />
    </Suspense>
  );
}
