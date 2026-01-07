"use client";

import { useState } from "react";
import { isPast, isFuture, isToday } from "date-fns";
import { Calendar, CheckCircle2, XCircle } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingCard } from "./BookingCard";
import type { Booking } from "@/services/bookings.service";

interface BookingsListProps {
  bookings: Booking[];
}

type TabType = "upcoming" | "past" | "cancelled";

export function BookingsList({ bookings }: BookingsListProps) {
  const [activeTab, setActiveTab] = useState<TabType>("upcoming");

  const filteredBookings = bookings.filter((booking) => {
    // Filter by Tab
    const checkOut = new Date(booking.checkOut);

    if (activeTab === "upcoming") {
      // Confirmed bookings in future or today
      return (
        booking.status === "confirmed" &&
        (isFuture(checkOut) || isToday(checkOut))
      );
    } else if (activeTab === "past") {
      // Confirmed bookings in past
      return (
        booking.status === "confirmed" && isPast(checkOut) && !isToday(checkOut)
      );
    } else if (activeTab === "cancelled") {
      return booking.status === "cancelled";
    }

    return false;
  });

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <Tabs
          defaultValue="upcoming"
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as TabType)}
          className="w-full"
        >
          <TabsList className="grid w-full md:w-[400px] grid-cols-3 bg-muted/50 p-1">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Bookings Grid */}
      {filteredBookings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in duration-300">
          {filteredBookings.map((booking) => (
            <div key={booking._id} className="h-full">
              <BookingCard booking={booking} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in duration-300">
          <div className="bg-muted/30 p-4 rounded-full mb-4">
            {activeTab === "upcoming" && (
              <Calendar className="h-8 w-8 text-muted-foreground" />
            )}
            {activeTab === "past" && (
              <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
            )}
            {activeTab === "cancelled" && (
              <XCircle className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <h3 className="text-xl font-medium text-foreground">
            No bookings found
          </h3>
          <p className="text-muted-foreground mt-1 max-w-sm">
            You don&apos;t have any {activeTab} bookings yet.
          </p>
        </div>
      )}
    </div>
  );
}
