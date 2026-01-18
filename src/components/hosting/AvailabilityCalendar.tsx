"use client";

import { useState, useTransition } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2, Trash2, CalendarOff, CalendarCheck } from "lucide-react";
import { DateRange } from "react-day-picker";
import type { BlockedDate } from "@/types";
import {
  createBlockedDate,
  deleteBlockedDate,
} from "@/services/blocked-dates.service";

interface AvailabilityCalendarProps {
  listingId: string;
  bookedDates?: { from: string; to: string; type?: "booking" | "blocked" }[];
  initialBlockedDates?: BlockedDate[];
}

export function AvailabilityCalendar({
  listingId,
  bookedDates = [],
  initialBlockedDates = [],
}: AvailabilityCalendarProps) {
  const [blockedDates, setBlockedDates] =
    useState<BlockedDate[]>(initialBlockedDates);
  // No explicit loading state needed as data is now passed from server
  const [isPending, startTransition] = useTransition();
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [reason, setReason] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Parse date string to Date object
  const parseDate = (dateStr: string) => {
    if (!dateStr) return undefined;
    const parts = dateStr.split("T")[0].split("-");
    return new Date(
      parseInt(parts[0]),
      parseInt(parts[1]) - 1,
      parseInt(parts[2]),
    );
  };

  // Check if a date falls within a booking (not host-blocked)
  const isDateBooked = (day: Date): boolean => {
    return bookedDates.some((booking) => {
      if (booking.type === "blocked") return false;
      const bookingStart = parseDate(booking.from);
      const bookingEnd = parseDate(booking.to);
      if (!bookingStart || !bookingEnd) return false;
      return day >= bookingStart && day < bookingEnd;
    });
  };

  // Check if a date falls within a blocked period
  // End date is exclusive (like checkout) - allows same-day turnover
  const isDateBlocked = (day: Date): boolean => {
    return blockedDates.some((blocked) => {
      const start = parseDate(blocked.startDate);
      const end = parseDate(blocked.endDate);
      if (!start || !end) return false;
      return day >= start && day < end;
    });
  };

  // Handle date selection
  const handleDateSelect = (range: DateRange | undefined) => {
    if (!range) {
      setSelectedRange(undefined);
      return;
    }

    // Enforce minimum 1 night (2 days) selection
    // If user selects same day for start and end, treat it as just selecting the start date
    // This allows them to then click another date to finish the range
    if (range.from && range.to && range.from.getTime() === range.to.getTime()) {
      setSelectedRange({ from: range.from, to: undefined });
      return;
    }

    // Validate that the range doesn't overlap with disabled dates
    if (range.from && range.to) {
      const currentDate = new Date(range.from);
      const endDate = range.to;

      // Check every night in the range (exclusive of end date for turnover)
      while (currentDate < endDate) {
        if (isDateBooked(currentDate) || isDateBlocked(currentDate)) {
          toast.error("Selected range overlaps with unavailable dates");
          setSelectedRange(undefined);
          return;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    setSelectedRange(range);
  };

  // Block selected dates
  const handleBlockDates = () => {
    if (!selectedRange?.from || !selectedRange?.to) {
      toast.error("Please select a date range");
      return;
    }

    startTransition(async () => {
      try {
        const newBlocked = await createBlockedDate(listingId, {
          startDate: format(selectedRange.from!, "yyyy-MM-dd"),
          endDate: format(selectedRange.to!, "yyyy-MM-dd"),
          reason: reason || undefined,
        });
        setBlockedDates((prev) => [...prev, newBlocked]);
        setSelectedRange(undefined);
        setReason("");
        setPopoverOpen(false);
        toast.success("Dates blocked successfully");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to block dates";
        toast.error(message);
      }
    });
  };

  // Unblock dates
  const handleUnblockDates = async (blockedId: string) => {
    setDeletingId(blockedId);
    try {
      await deleteBlockedDate(listingId, blockedId);
      setBlockedDates((prev) => prev.filter((b) => b._id !== blockedId));
      toast.success("Dates unblocked successfully");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to unblock dates";
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Calendar Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarOff className="h-5 w-5" />
            Manage Availability
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Select dates to block when your listing is unavailable (e.g.,
            external bookings, maintenance).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center">
            <Calendar
              mode="range"
              selected={selectedRange}
              onSelect={handleDateSelect}
              numberOfMonths={2}
              className="rounded-2xl border [--cell-size:--spacing(10)]"
              startMonth={new Date()}
              fromDate={new Date()}
              modifiers={{
                booked: (day) => isDateBooked(day),
                blocked: (day) => isDateBlocked(day),
              }}
              modifiersClassNames={{
                blocked:
                  "bg-destructive/20 text-destructive-foreground rounded-full",
              }}
              disabled={(day) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return day < today || isDateBooked(day) || isDateBlocked(day);
              }}
            />
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-destructive/20 border border-destructive/50" />
              <span className="text-muted-foreground">Blocked by you</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-muted relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-px w-3 bg-muted-foreground" />
              </div>
              <span className="text-muted-foreground">Guest booking</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-primary" />
              <span className="text-muted-foreground">Selected</span>
            </div>
          </div>

          {/* Block dates action */}
          {selectedRange?.from && selectedRange?.to && (
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border rounded-lg bg-muted/50">
              <div className="flex-1 text-center sm:text-left">
                <p className="font-medium">
                  {format(selectedRange.from, "MMM d, yyyy")} —{" "}
                  {format(selectedRange.to, "MMM d, yyyy")}
                </p>
                <p className="text-sm text-muted-foreground">
                  Block these dates?
                </p>
              </div>
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button className="rounded-full">
                    <CalendarOff />
                    Block Dates
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reason">Reason (optional)</Label>
                      <Input
                        id="reason"
                        placeholder="e.g., External booking, Maintenance"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setPopoverOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={handleBlockDates}
                        disabled={isPending}
                      >
                        {isPending ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          "Confirm"
                        )}
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                variant="ghost"
                onClick={() => setSelectedRange(undefined)}
              >
                Clear
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Blocked Dates List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" />
            Blocked Periods
          </CardTitle>
        </CardHeader>
        <CardContent>
          {blockedDates.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No dates are currently blocked.
            </p>
          ) : (
            <div className="space-y-3">
              {blockedDates.map((blocked) => (
                <div
                  key={blocked._id}
                  className="flex items-center justify-between p-3 border rounded-2xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-sm">
                      <p className="font-medium">
                        {format(new Date(blocked.startDate), "MMM d, yyyy")} —{" "}
                        {format(new Date(blocked.endDate), "MMM d, yyyy")}
                      </p>
                      {blocked.reason && (
                        <Badge variant="secondary" className="mt-1">
                          {blocked.reason}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleUnblockDates(blocked._id)}
                    disabled={deletingId === blocked._id}
                  >
                    {deletingId === blocked._id ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Trash2 />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
