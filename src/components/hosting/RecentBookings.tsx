"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Booking } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/navigation";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";

interface RecentBookingsProps {
  bookings: Booking[];
}

export function RecentBookings({ bookings }: RecentBookingsProps) {
  const t = useTranslations("hosting");

  if (!bookings?.length) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-xl">
        <p className="text-muted-foreground text-lg">{t("no_bookings")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted!">
              <TableHead className="px-6">{t("col_guest")}</TableHead>
              <TableHead>{t("col_listing")}</TableHead>
              <TableHead>{t("col_dates")}</TableHead>
              <TableHead>{t("col_total_price")}</TableHead>
              <TableHead className="text-end px-6">{t("col_status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking._id}>
                <TableCell className="font-medium px-6">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={booking.guest?.avatar}
                        alt={booking.guest?.name}
                      />
                      <AvatarFallback>
                        {booking.guest?.name?.[0]?.toUpperCase() || "G"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span>{booking.guest?.name || t("unknown_guest")}</span>
                      <span className="text-xs text-muted-foreground">
                        {booking.guest?.email || t("no_email")}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/listings/${booking.listing?._id}`}
                    className="hover:underline"
                  >
                    {booking.listing?.title || t("unknown_listing")}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col text-sm">
                    <span className="whitespace-nowrap">
                      {format(new Date(booking.checkIn), "MMM d, yyyy")}
                    </span>
                    <span className="text-muted-foreground text-xs whitespace-nowrap">
                      {t("date_to")}{" "}
                      {format(new Date(booking.checkOut), "MMM d, yyyy")}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{formatCurrency(booking.totalPrice)}</TableCell>
                <TableCell className="text-end px-6">
                  <Badge
                    variant={
                      booking.status === "confirmed"
                        ? "default"
                        : booking.status === "cancelled"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {t(`status_${booking.status}`) || booking.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
