"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "nextjs-toploader/app";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createBookingAction } from "@/actions";
import { toast } from "sonner";
import type { Listing } from "@/services/listings.service";
import type { User, AuthUser } from "@/types";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn, formatCurrency } from "@/lib/utils";
import { format, differenceInCalendarDays } from "date-fns";
import { Minus, Plus, ChevronDown } from "lucide-react";
import { DateRange } from "react-day-picker";
import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";
import type { InitiatePaymentResult } from "@/lib/paymob";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { authService } from "@/services/auth.service";

interface BookingFormProps {
  listing: Listing;
  bookedDates?: { from: string; to: string; type?: "booking" | "blocked" }[];
}

export function BookingForm({ listing, bookedDates = [] }: BookingFormProps) {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  const [date, setDate] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(1);

  // Standard pattern for handling hydration issues with dynamic IDs from Radix UI
  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper to parse "YYYY-MM-DD" string to local date safely
  const parseDate = (dateStr: string) => {
    if (!dateStr) return undefined;
    const parts = dateStr.split("T")[0].split("-");
    return new Date(
      parseInt(parts[0]),
      parseInt(parts[1]) - 1,
      parseInt(parts[2]),
    );
  };

  // Check if a night is already booked/blocked (used for visual line and disabling)
  // End date is checkout/end day (exclusive) - guest can check-in on that day
  const isNightBooked = (day: Date): boolean => {
    return bookedDates.some((booking) => {
      const bookingStart = parseDate(booking.from);
      const bookingEnd = parseDate(booking.to);
      if (!bookingStart || !bookingEnd) return false;
      // End date is exclusive (checkout day available for new check-in)
      return day >= bookingStart && day < bookingEnd;
    });
  };

  // Helper function to check if a range contains any booked/blocked dates (Validation)
  // End date is checkout/end (exclusive) - same day turnover allowed
  const rangeOverlapsBooking = (start: Date, end: Date): boolean => {
    return bookedDates.some((booking) => {
      const bookingStart = parseDate(booking.from);
      const bookingEnd = parseDate(booking.to);
      if (!bookingStart || !bookingEnd) return false;
      // Overlap condition: (StartA < EndB) and (EndA > StartB)
      return start < bookingEnd && bookingStart < end;
    });
  };

  // Custom handler for date selection with validation
  const handleDateSelect = (selectedRange: DateRange | undefined) => {
    if (!selectedRange) {
      setDate(undefined);
      return;
    }

    // Enforce 1-night minimum: if start === end, treat as just start selected
    if (
      selectedRange.from &&
      selectedRange.to &&
      selectedRange.from.getTime() === selectedRange.to.getTime()
    ) {
      selectedRange.to = undefined;
    }

    // If both from and to are selected, validate the range
    if (selectedRange.from && selectedRange.to) {
      if (rangeOverlapsBooking(selectedRange.from, selectedRange.to)) {
        toast.error(
          "Selected date range includes already booked dates. Please choose different dates.",
        );
        setDate(undefined);
        return;
      }
    }

    setDate(selectedRange);
  };

  const checkProfileComplete = (u: User | AuthUser) => {
    return !!(
      u.name &&
      u.phoneNumber &&
      u.country &&
      u.nationalId &&
      u.emailVerified
    );
  };

  const executeBooking = () => {
    if (!date?.from || !date?.to) return;

    startTransition(async () => {
      try {
        // Step 1: Create booking with pending_payment status
        const booking = await createBookingAction({
          listingId: listing._id,
          checkIn: format(date.from!, "yyyy-MM-dd"),
          checkOut: format(date.to!, "yyyy-MM-dd"),
          guests: Number(guests),
        });

        // Step 2: Initiate payment and get checkout URL
        const paymentResponse = await apiClient.post<
          ApiResponse<InitiatePaymentResult>
        >("/payments/initiate", {
          bookingId: booking._id,
        });

        if (!paymentResponse.success || !paymentResponse.data.checkoutUrl) {
          throw new Error("Failed to initiate payment");
        }

        // Step 3: Redirect to Paymob checkout
        window.location.href = paymentResponse.data.checkoutUrl;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to create booking";
        toast.error(message);
      }
    });
  };

  const handleBooking = () => {
    if (!user) {
      toast.error("Please login to book");
      router.push("/auth/login");
      return;
    }

    // Check for incomplete profile
    if (!checkProfileComplete(user)) {
      setShowProfileDialog(true);
      return;
    }

    executeBooking();
  };

  const nights =
    date?.from && date?.to ? differenceInCalendarDays(date.to, date.from) : 0;

  return (
    <Card className="border shadow-xl">
      <CardHeader>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold">
            {formatCurrency(listing.pricePerNight)}
          </span>
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
                          !date?.from && "text-muted-foreground",
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
                          !date?.to && "text-muted-foreground",
                        )}
                      >
                        {date?.to ? format(date.to, "MM/dd/yyyy") : "Add date"}
                      </div>
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 rounded-2xl"
                  align="center"
                >
                  <Calendar
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={handleDateSelect}
                    // className="[--cell-size:--spacing(11)] md:[--cell-size:--spacing(10)]"
                    startMonth={new Date()}
                    fromDate={new Date()}
                    modifiers={{
                      booked: (day) => isNightBooked(day),
                    }}
                    disabled={(day) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);

                      // Disable past dates
                      if (day < today) {
                        return true;
                      }

                      // Disable nights already booked by others
                      return isNightBooked(day);
                    }}
                  />
                  <div className="p-3 border-t flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDate(undefined)}
                      className="text-xs font-semibold underline hover:bg-transparent p-0 h-auto"
                    >
                      Clear dates
                    </Button>
                  </div>
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
                          setGuests(Math.min(listing.maxGuests, guests + 1))
                        }
                        disabled={guests >= listing.maxGuests}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground text-center">
                    Max guests: {listing.maxGuests}
                  </div>
                </PopoverContent>
              </Popover>
            </>
          )}
        </div>

        <Button
          className="w-full font-semibold text-lg py-6 rounded-full"
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
                {formatCurrency(listing.pricePerNight)} x {nights} nights
              </span>
              <span>{formatCurrency(listing.pricePerNight * nights)}</span>
            </div>
            <div className="pt-4 border-t flex justify-between font-semibold text-foreground text-lg">
              <span>Total</span>
              <span>{formatCurrency(listing.pricePerNight * nights)}</span>
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent variant="drawer" className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Complete Your Profile</DialogTitle>
            <DialogDescription>
              Please complete the following details to proceed with your
              booking.
            </DialogDescription>
          </DialogHeader>
          {user && (
            <ProfileForm
              user={user}
              isDialog
              onSuccess={async () => {
                await refreshUser();
                // Validate fresh user state
                try {
                  const freshUser = await authService.me();
                  if (checkProfileComplete(freshUser)) {
                    setShowProfileDialog(false);
                    toast.success(
                      "Profile complete! Proceeding to reservation...",
                    );
                    executeBooking();
                  } else {
                    toast.error("Please complete all required fields.");
                  }
                } catch {
                  toast.error("Failed to verify profile status");
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
