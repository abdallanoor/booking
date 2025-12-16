"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import { format } from "date-fns";
import { Search as SearchIcon, Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [location, setLocation] = useState(searchParams.get("location") || "");

  const initialFrom = searchParams.get("checkIn")
    ? new Date(searchParams.get("checkIn")!)
    : undefined;
  const initialTo = searchParams.get("checkOut")
    ? new Date(searchParams.get("checkOut")!)
    : undefined;

  const [date, setDate] = useState<DateRange | undefined>({
    from: initialFrom,
    to: initialTo,
  });

  const [guests, setGuests] = useState(
    parseInt(searchParams.get("guests") || "1")
  );

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location) params.append("location", location);
    if (date?.from) params.append("checkIn", format(date.from, "yyyy-MM-dd"));
    if (date?.to) params.append("checkOut", format(date.to, "yyyy-MM-dd"));
    if (guests > 1) params.append("guests", guests.toString());

    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row items-center bg-card rounded-2xl md:rounded-full border shadow-lg hover:shadow-xl transition-shadow duration-300 divide-y md:divide-y-0 md:divide-x p-1 overflow-hidden md:overflow-visible">
        {/* Location Input */}
        <div className="relative flex-1 px-6 py-3 hover:bg-muted rounded-xl md:rounded-full cursor-pointer transition w-full md:w-auto group">
          <label className="block text-xs font-bold text-foreground mb-0.5 group-hover:text-foreground/80">
            Where
          </label>
          <input
            type="text"
            placeholder="Search destinations"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full bg-transparent border-none text-sm text-muted-foreground placeholder:text-muted-foreground/50 focus:outline-none truncate"
          />
        </div>

        {/* Dates (Unified) */}
        <Popover>
          <PopoverTrigger asChild>
            <div className="relative flex-[1.5] px-6 py-3 hover:bg-muted rounded-xl md:rounded-full cursor-pointer transition w-full md:w-auto text-left group">
              <label className="block text-xs font-bold text-foreground mb-0.5 group-hover:text-foreground/80">
                Dates
              </label>
              <div
                className={cn(
                  "text-sm truncate font-medium",
                  !date?.from && "text-muted-foreground/50"
                )}
              >
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "MMM dd")} -{" "}
                      {format(date.to, "MMM dd")}
                    </>
                  ) : (
                    format(date.from, "MMM dd")
                  )
                ) : (
                  "Add dates"
                )}
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
              disabled={(date) => date < new Date()}
            />
          </PopoverContent>
        </Popover>

        {/* Guests & Search Button */}
        <div className="relative flex-[0.8] pl-6 pr-2 py-2 hover:bg-muted rounded-xl md:rounded-full cursor-pointer transition flex items-center justify-between w-full md:w-auto group">
          <Popover>
            <PopoverTrigger asChild>
              <div className="flex-1 text-left">
                <label className="block text-xs font-bold text-foreground mb-0.5 group-hover:text-foreground/80">
                  Who
                </label>
                <div
                  className={cn(
                    "text-sm truncate font-medium",
                    guests === 0 && "text-muted-foreground/50"
                  )}
                >
                  {guests > 0
                    ? `${guests} guest${guests > 1 ? "s" : ""}`
                    : "Add guests"}
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-foreground">Adults</div>
                  <div className="text-sm text-muted-foreground">
                    Ages 13 or above
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full border-input text-foreground"
                    onClick={() => setGuests(Math.max(1, guests - 1))}
                    disabled={guests <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-4 text-center text-foreground">
                    {guests}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full border-input text-foreground"
                    onClick={() => setGuests(guests + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            size="icon"
            className="rounded-full h-12 w-12 shrink-0 ml-2 shadow-md hover:scale-105 transition-transform"
            onClick={handleSearch}
          >
            <SearchIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
