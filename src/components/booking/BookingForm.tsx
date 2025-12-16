"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createBookingAction } from "@/actions";
import { toast } from "sonner";
import type { Property } from "@/services/properties.service";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, differenceInCalendarDays } from "date-fns";
import { Minus, Plus, ChevronDown } from "lucide-react";
import { DateRange } from "react-day-picker";

interface BookingFormProps {
  property: Property;
  bookedDates?: { from: string; to: string }[];
}

export function BookingForm({ property, bookedDates = [] }: BookingFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  const [date, setDate] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(1);

  // Standard pattern for handling hydration issues with dynamic IDs from Radix UI
  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true);
  }, []);

  // Helper function to check if a date is booked
  const isDateBooked = (day: Date): boolean => {
    return bookedDates.some((booking) => {
      const bookingStart = new Date(booking.from);
      bookingStart.setHours(0, 0, 0, 0);
      const bookingEnd = new Date(booking.to);
      bookingEnd.setHours(0, 0, 0, 0);
      return day >= bookingStart && day <= bookingEnd;
    });
  };

  // Helper function to check if a range contains any booked dates
  const rangeContainsBookedDates = (from: Date, to: Date): boolean => {
    const current = new Date(from);
    current.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setHours(0, 0, 0, 0);

    while (current <= end) {
      if (isDateBooked(current)) {
        return true;
      }
      current.setDate(current.getDate() + 1);
    }
    return false;
  };

  // Custom handler for date selection with validation
  const handleDateSelect = (selectedRange: DateRange | undefined) => {
    if (!selectedRange) {
      setDate(undefined);
      return;
    }

    // If both from and to are selected, validate the range
    if (selectedRange.from && selectedRange.to) {
      if (rangeContainsBookedDates(selectedRange.from, selectedRange.to)) {
        toast.error(
          "Selected date range includes already booked dates. Please choose different dates."
        );
        setDate(undefined);
        return;
      }
    }

    setDate(selectedRange);
  };

  const handleBooking = () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    if (!date?.from || !date?.to) return;

    startTransition(async () => {
      try {
        await createBookingAction({
          propertyId: property._id,
          checkIn: format(date.from!, "yyyy-MM-dd"),
          checkOut: format(date.to!, "yyyy-MM-dd"),
          guests: Number(guests),
        });
        toast.success("Booking created successfully");
        router.push("/bookings");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to create booking";
        toast.error(message);
      }
    });
  };

  const nights =
    date?.from && date?.to ? differenceInCalendarDays(date.to, date.from) : 0;

  return (
    <Card className="border shadow-xl rounded-xl overflow-hidden sticky top-24">
      <CardHeader>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold">${property.pricePerNight}</span>
          <span className="text-muted-foreground"> night</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border rounded-xl bg-background overflow-hidden relative">
          {!mounted ? (
            // Static fallback for server-side rendering
            <>
              <div className="grid grid-cols-2 border-b">
                <div className="p-3 border-r relative text-left">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-0.5">
                    Check-in
                  </label>
                  <div className="text-sm text-muted-foreground">Add date</div>
                </div>
                <div className="p-3 relative text-left">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-0.5">
                    Check-out
                  </label>
                  <div className="text-sm text-muted-foreground">Add date</div>
                </div>
              </div>
              <div className="p-3 relative flex justify-between items-center text-left">
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-0.5">
                    Guests
                  </label>
                  <div className="text-sm">1 guest</div>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </>
          ) : (
            // Client-side interactive Popovers
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <div className="grid grid-cols-2 border-b cursor-pointer">
                    <div className="p-3 border-r hover:bg-muted/50 transition-colors relative text-left">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-0.5">
                        Check-in
                      </label>
                      <div
                        className={cn(
                          "text-sm",
                          !date?.from && "text-muted-foreground"
                        )}
                      >
                        {date?.from
                          ? format(date.from, "MM/dd/yyyy")
                          : "Add date"}
                      </div>
                    </div>
                    <div className="p-3 hover:bg-muted/50 transition-colors relative text-left">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-0.5">
                        Check-out
                      </label>
                      <div
                        className={cn(
                          "text-sm",
                          !date?.to && "text-muted-foreground"
                        )}
                      >
                        {date?.to ? format(date.to, "MM/dd/yyyy") : "Add date"}
                      </div>
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={handleDateSelect}
                    numberOfMonths={2}
                    disabled={(day) => {
                      // Normalize to midnight for accurate comparison
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);

                      // Disable past dates
                      if (day < today) {
                        return true;
                      }

                      // Check if the date is booked
                      return isDateBooked(day);
                    }}
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <div className="p-3 hover:bg-muted/50 transition-colors cursor-pointer relative flex justify-between items-center text-left">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-0.5">
                        Guests
                      </label>
                      <div className="text-sm">
                        {guests} guest{guests !== 1 && "s"}
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="end">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">Adults</div>
                      <div className="text-sm text-muted-foreground">
                        age 13+
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => setGuests(Math.max(1, guests - 1))}
                        disabled={guests <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-4 text-center">{guests}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() =>
                          setGuests(Math.min(property.maxGuests, guests + 1))
                        }
                        disabled={guests >= property.maxGuests}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground text-center">
                    Max guests: {property.maxGuests}
                  </div>
                </PopoverContent>
              </Popover>
            </>
          )}
        </div>

        <Button
          className="w-full font-semibold text-lg py-6"
          onClick={handleBooking}
          disabled={isPending || !date?.from || !date?.to}
          size="lg"
        >
          {isPending ? "Booking..." : "Reserve"}
        </Button>

        {date?.from && date?.to && nights > 0 && (
          <div className="space-y-3 pt-4">
            <div className="flex justify-between text-muted-foreground">
              <span className="underline">
                ${property.pricePerNight} x {nights} nights
              </span>
              <span>${property.pricePerNight * nights}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span className="underline">Service fee</span>
              <span>$0</span>
            </div>
            <div className="pt-4 border-t flex justify-between font-semibold text-foreground text-lg">
              <span>Total</span>
              <span>${property.pricePerNight * nights}</span>
            </div>
          </div>
        )}

        {!user && (
          <p className="text-xs text-center text-rose-600 font-medium">
            Please login to book this property
          </p>
        )}
      </CardContent>
    </Card>
  );
}
