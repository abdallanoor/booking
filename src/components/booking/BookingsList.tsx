"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BookingCard } from "./BookingCard";
import type { Booking } from "@/services/bookings.service";

interface BookingsListProps {
  bookings: Booking[];
}

export function BookingsList({ bookings }: BookingsListProps) {
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {bookings.map((booking) => (
        <BookingCard key={booking._id} booking={booking} />
      ))}
    </div>
  );
}
