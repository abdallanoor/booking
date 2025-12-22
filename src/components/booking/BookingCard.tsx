"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cancelBookingAction } from "@/actions";
import { toast } from "sonner";
import { useTransition } from "react";
import type { Booking } from "@/services/bookings.service";

interface BookingCardProps {
  booking: Booking;
}

export function BookingCard({ booking }: BookingCardProps) {
  const [isPending, startTransition] = useTransition();

  const handleCancel = (id: string) => {
    startTransition(async () => {
      try {
        await cancelBookingAction(id);
        toast.success("Booking cancelled");
      } catch {
        toast.error("Failed to cancel booking");
      }
    });
  };

  if (!booking.listing) {
    return (
      <Card className="border-dashed bg-muted/50">
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          <p className="font-semibold text-muted-foreground">
            Listing Unavailable
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            The listing for this booking is no longer available.
          </p>
          <div className="flex justify-between w-full max-w-sm mt-4 text-sm">
            <span>Check-in: {format(new Date(booking.checkIn), "PPP")}</span>
            <span>Total: ${booking.totalPrice}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{booking.listing.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {booking.listing.location.city},{" "}
              {booking.listing.location.country}
            </p>
          </div>
          <Badge
            variant={
              booking.status === "confirmed"
                ? "default"
                : booking.status === "cancelled"
                ? "destructive"
                : "secondary"
            }
          >
            {booking.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Check-in:</span>
            <span>{format(new Date(booking.checkIn), "PPP")}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Check-out:</span>
            <span>{format(new Date(booking.checkOut), "PPP")}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Guests:</span>
            <span>{booking.guests}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total Price:</span>
            <span>${booking.totalPrice}</span>
          </div>

          {booking.status === "confirmed" && (
            <Button
              variant="destructive"
              size="sm"
              className="w-full mt-4"
              onClick={() => handleCancel(booking._id)}
              disabled={isPending}
            >
              {isPending ? "Cancelling..." : "Cancel Booking"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
