"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Booking } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";

interface RecentBookingsProps {
  bookings: Booking[];
}

export function RecentBookings({ bookings }: RecentBookingsProps) {
  if (!bookings?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            No bookings found yet.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Bookings</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Guest</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking._id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      {/* Placeholder since booking.guest might not have avatar in Booking type yet, 
                           checking type def I see guest has name and email but not avatar explicitly 
                           in the truncated view, but let's assume or fall back */}
                      <AvatarFallback>
                        {booking.guest.name?.[0]?.toUpperCase() || "G"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span>{booking.guest?.name || "Unknown Guest"}</span>
                      <span className="text-xs text-muted-foreground">
                        {booking.guest?.email || "No email"}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/properties/${booking.property?._id}`}
                    className="hover:underline"
                  >
                    {booking.property?.title || "Unknown Property"}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col text-sm">
                    <span>
                      {format(new Date(booking.checkIn), "MMM d, yyyy")}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      to {format(new Date(booking.checkOut), "MMM d, yyyy")}
                    </span>
                  </div>
                </TableCell>
                <TableCell>${booking.totalPrice.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      booking.status === "confirmed"
                        ? "default" // or success if available? using default (primary) often green or black
                        : booking.status === "cancelled"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {booking.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
