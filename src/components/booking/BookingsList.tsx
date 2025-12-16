"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cancelBookingAction } from "@/actions";
import { toast } from "sonner";
import { useTransition } from "react";
import type { Booking } from "@/services/bookings.service";

interface BookingsListProps {
  bookings: Booking[];
}

export function BookingsList({ bookings }: BookingsListProps) {
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

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            You haven&apos;t made any bookings yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <Card key={booking._id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{booking.property.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {booking.property.location.city},{" "}
                  {booking.property.location.country}
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
      ))}
    </div>
  );
}
