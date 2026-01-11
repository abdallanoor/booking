"use client";

import { useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { MapPin, Users, CreditCard, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import type { Booking } from "@/services/bookings.service";
import { formatCurrency } from "@/lib/utils";
import { CancellationModal } from "../../../../components/booking/CancellationModal";
import { Host } from "@/types";

// We need to hint that listing has these extra fields
type BookingWithHost = Omit<Booking, "listing"> & {
  listing: Booking["listing"] & {
    host: Host; // Mongoose populate replaces ObjectId with object
  };
};

interface BookingDetailsViewProps {
  booking: Booking;
}

export function BookingDetailsView({ booking }: BookingDetailsViewProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const {
    listing,
    status,
    checkIn,
    checkOut,
    totalPrice,
    guests,
    _id,
    paymentStatus,
  } = booking as unknown as BookingWithHost;

  // Handles case where listing might be deleted
  // In `Booking`, listing is potentially undefined (optional) or deleted
  if (!listing) return <div>Listing details unavailable</div>;

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  const statusColor =
    status === "confirmed"
      ? "bg-green-500/10 text-green-700"
      : status === "cancelled"
        ? "bg-red-500/10 text-red-700"
        : "bg-yellow-500/10 text-yellow-700";

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content (Left Column) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Greeting / Status */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">
                {status === "confirmed"
                  ? "Refined stay confirmed!"
                  : status === "cancelled"
                    ? "Booking cancelled"
                    : "Booking details"}
              </h1>
              <p className="text-muted-foreground">
                Booking ID:{" "}
                <span className="font-mono text-foreground">
                  {_id.slice(-8).toUpperCase()}
                </span>
              </p>
            </div>
            <Badge className={`text-sm px-3 py-1 ${statusColor} border-none`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          </div>

          {/* Property Card */}
          <Card className="overflow-hidden pt-0!">
            <div className="relative h-72 w-full">
              <Image
                src={listing.images?.[0]}
                alt={listing.title}
                fill
                className="object-cover"
              />
            </div>
            <CardContent>
              <h2 className="text-2xl font-semibold mb-2">{listing.title}</h2>
              <div className="flex items-center text-muted-foreground mb-4">
                <MapPin className="h-4 w-4 mr-1" />
                {listing.location.city}, {listing.location.country}
              </div>

              <div className="grid grid-cols-2 gap-6 py-4 border-t border-b border-border/50">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Check-in
                  </span>
                  <div className="font-medium text-lg">
                    {format(checkInDate, "EEE, MMM d")}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    After 2:00 PM
                  </div>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Check-out
                  </span>
                  <div className="font-medium text-lg">
                    {format(checkOutDate, "EEE, MMM d")}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Before 12:00 PM
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <span>{guests} Guests</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                  </div>
                  <span>Full protection</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Host Info */}
          {listing.host && typeof listing.host !== "string" && (
            <Card>
              <CardHeader>
                <CardTitle>Hosted by</CardTitle>
              </CardHeader>
              <CardContent className="relative flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={(listing.host as Host).avatar} />
                  <AvatarFallback className="bg-muted text-muted-foreground">
                    {(listing.host as Host).name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1 min-w-0">
                  <div className="font-medium text-lg truncate">
                    {(listing.host as Host).name}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {(listing.host as Host).email}
                  </div>
                  {(listing.host as Host).phoneNumber && (
                    <div className="text-sm text-muted-foreground truncate">
                      {(listing.host as Host).phoneNumber}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar (Right Column) */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between font-bold text-2xl">
                <span>Total Amount</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
              <Badge
                variant="outline"
                className="w-full justify-center py-2 mt-4"
              >
                Payment Status: {paymentStatus.toUpperCase()}
              </Badge>
            </CardContent>
          </Card>

          {/* Cancellation Actions */}
          {status === "confirmed" && (
            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-destructive text-lg">
                  Cancel Booking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Need to change your plans? You can cancel at any time. Note:
                  Refunds are only available for cancellations made at least 48
                  hours before check-in.
                </p>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setShowCancelModal(true)}
                >
                  Request Cancellation
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <CancellationModal
        bookingId={_id}
        checkInDate={checkIn}
        open={showCancelModal}
        onOpenChange={setShowCancelModal}
      />
    </div>
  );
}
