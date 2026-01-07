"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar, MapPin, ChevronRight, MoreVertical } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { Booking } from "@/services/bookings.service";
import { formatCurrency } from "@/lib/utils";
import { CancellationModal } from "./CancellationModal";

interface BookingCardProps {
  booking: Booking;
}

export function BookingCard({ booking }: BookingCardProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const { listing, status, checkIn, checkOut, totalPrice, _id } = booking;

  // Fallback for missing listing (deleted/hidden)
  if (!listing) {
    return (
      <Card className="group overflow-hidden border-dashed bg-muted/30 flex flex-row items-center p-3 gap-4 shadow-none">
        <div className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-lg bg-muted/50 flex items-center justify-center">
          <MapPin className="h-6 w-6 text-muted-foreground opacity-50" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-muted-foreground">
            Listing Unavailable
          </p>
          <p className="text-[10px] text-muted-foreground/60 mb-2">
            This property is no longer available.
          </p>
          <div className="text-[10px] text-muted-foreground/60 space-y-0.5">
            <p className="flex items-center">
              <Calendar className="h-2.5 w-2.5 mr-1" />{" "}
              {format(new Date(checkIn), "PPP")}
            </p>
            <p>ID: {_id.slice(-6).toUpperCase()}</p>
          </div>
        </div>
      </Card>
    );
  }

  const statusColor =
    status === "confirmed"
      ? "bg-green-500/10 text-green-700 hover:bg-green-500/20"
      : status === "cancelled"
      ? "bg-red-500/10 text-red-700 hover:bg-red-500/20"
      : "bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20";

  return (
    <>
      <Card className="group relative overflow-hidden border-border hover:border-primary/40 transition-all duration-300 shadow-none hover:shadow flex flex-row items-center p-3 gap-4 cursor-pointer">
        {/* Stretched Link for the whole card */}
        <Link href={`/bookings/${_id}`} className="absolute inset-0 z-0">
          <span className="sr-only">View Details</span>
        </Link>

        {/* Compact Image Section */}
        <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-lg bg-muted pointer-events-none">
          {listing.images?.[0] && (
            <Image
              src={listing.images?.[0]}
              alt={listing.title}
              fill
              className="object-cover"
              sizes="100px"
            />
          )}
        </div>

        {/* Info Section */}
        <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5 pointer-events-none">
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm sm:text-base line-clamp-1 group-hover:text-primary transition-colors">
                {listing.title}
              </h3>
              <Badge
                className={`text-[10px] px-2 py-0 h-5 border-none shrink-0 ${statusColor}`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1 opacity-70" />
                {format(new Date(checkIn), "MMM d")} -{" "}
                {format(new Date(checkOut), "MMM d")}
              </div>
              <div className="flex items-center">
                <MapPin className="h-3 w-3 mr-1 opacity-70" />
                {listing.location.city}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-auto pt-2">
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground leading-none mb-0.5">
                Total Price
              </span>
              <span className="font-bold text-primary text-sm sm:text-base">
                {formatCurrency(totalPrice)}
              </span>
            </div>

            <div className="relative z-10 flex items-center gap-1 pointer-events-auto">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                asChild
              >
                <Link href={`/bookings/${_id}`}>
                  Details
                  <ChevronRight />
                </Link>
              </Button>

              {status === "confirmed" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCancelModal(true);
                      }}
                    >
                      Cancel Booking
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </Card>

      <CancellationModal
        bookingId={_id}
        checkInDate={checkIn}
        open={showCancelModal}
        onOpenChange={setShowCancelModal}
      />
    </>
  );
}
