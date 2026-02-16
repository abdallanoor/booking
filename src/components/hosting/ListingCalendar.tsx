"use client";

import React, {
  useState,
  useEffect,
  useTransition,
  useCallback,
  useMemo,
  memo,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  format,
  addMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  isBefore,
  differenceInCalendarDays,
  startOfDay,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  X,
  RotateCcw,
  MessageSquare,
  Trash2,
  Edit2,
} from "lucide-react";
import type { CalendarDate } from "@/types";
import {
  getCalendarDates,
  updateCalendarDates,
} from "@/services/calendar-dates.service";
import { cn } from "@/lib/utils";

// --- Types ---

interface ListingCalendarProps {
  listingId: string;
  basePrice: number;
  weekendPrice?: number;
  bookedDates?: { from: string; to: string; type?: "booking" | "blocked" }[];
}

interface DateData {
  price: number;
  isBlocked: boolean;
  isBooked: boolean;
  hasCustomPrice: boolean;
  hasNote: boolean;
  note?: string;
}

// --- Constants ---

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// --- Helper Functions ---

const getDateKey = (date: Date) => format(date, "yyyy-MM-dd");

// --- Custom Hook ---

function useListingCalendar(
  listingId: string,
  basePrice: number,
  weekendPrice?: number,
  bookedDates: ListingCalendarProps["bookedDates"] = [],
) {
  const [currentMonth, setCurrentMonth] = useState(() =>
    startOfMonth(new Date()),
  );
  const [calendarDates, setCalendarDates] = useState<CalendarDate[]>([]);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [customPriceInput, setCustomPriceInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [isNoteInputVisible, setIsNoteInputVisible] = useState(false);
  const isEditingRef = React.useRef(false);

  // --- Derived State & Memorization ---

  const bookedIntervals = useMemo(() => {
    return bookedDates
      .filter((b) => b.type !== "blocked")
      .map((b) => ({
        start: startOfDay(new Date(b.from)),
        end: startOfDay(new Date(b.to)),
      }));
  }, [bookedDates]);

  const isDateBooked = useCallback(
    (date: Date) => {
      const time = date.getTime();
      return bookedIntervals.some(
        (interval) =>
          time >= interval.start.getTime() && time < interval.end.getTime(),
      );
    },
    [bookedIntervals],
  );

  const calendarDateMap = useMemo(() => {
    const map = new Map<string, CalendarDate>();
    for (const cd of calendarDates) {
      map.set(cd.date.split("T")[0], cd);
    }
    return map;
  }, [calendarDates]);

  const selectedDatesArray = useMemo(
    () => Array.from(selectedDates),
    [selectedDates],
  );

  const selectionStats = useMemo(() => {
    let hasBlocked = false;
    let hasAvailable = false;
    let hasCustomPrice = false;
    let commonPrice: number | null | undefined = undefined;
    let hasMixedPrices = false;
    let commonNote: string | null | undefined = undefined;
    let hasMixedNotes = false;

    if (selectedDates.size > 0) {
      const firstData = calendarDateMap.get(selectedDatesArray[0]);
      commonPrice = firstData?.customPrice;
      commonNote = firstData?.note;

      for (const dateKey of selectedDates) {
        const data = calendarDateMap.get(dateKey);
        if (data?.isBlocked) hasBlocked = true;
        else hasAvailable = true;

        if (data?.customPrice != null) hasCustomPrice = true;

        if (data?.customPrice !== commonPrice) hasMixedPrices = true;
        if (data?.note !== commonNote) hasMixedNotes = true;
      }
    }

    return {
      mixedBlockedStatus:
        hasBlocked && hasAvailable
          ? "mixed"
          : hasBlocked
            ? "blocked"
            : "available",
      hasCustomPrice,
      commonPrice: !hasMixedPrices ? commonPrice : undefined,
      commonNote: !hasMixedNotes ? commonNote : undefined,
    };
  }, [selectedDates, selectedDatesArray, calendarDateMap]);

  const noteGroups = useMemo(() => {
    if (selectedDates.size === 0) return [];
    const sortedDates = selectedDatesArray
      .map((d) => ({ key: d, data: calendarDateMap.get(d) }))
      .filter((item) => !!item.data?.note)
      .sort((a, b) => new Date(a.key).getTime() - new Date(b.key).getTime());

    if (sortedDates.length === 0) return [];

    const groups: { note: string; dates: Date[] }[] = [];
    sortedDates.forEach(({ key, data }) => {
      const date = new Date(key);
      const note = data!.note!;
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.note === note) {
        lastGroup.dates.push(date);
      } else {
        groups.push({ note, dates: [date] });
      }
    });

    return groups.map((group) => {
      const ranges: string[] = [];
      let start = group.dates[0];
      let end = group.dates[0];

      const formatRange = (s: Date, e: Date) => {
        if (isSameDay(s, e)) return format(s, "MMM d");
        if (s.getMonth() !== e.getMonth())
          return `${format(s, "MMM d")} – ${format(e, "MMM d")}`;
        return `${format(s, "MMM d")} – ${format(e, "d")}`;
      };

      for (let i = 1; i < group.dates.length; i++) {
        const current = group.dates[i];
        if (differenceInCalendarDays(current, end) === 1) {
          end = current;
        } else {
          ranges.push(formatRange(start, end));
          start = current;
          end = current;
        }
      }
      ranges.push(formatRange(start, end));

      return {
        note: group.note,
        dates: group.dates,
        ranges: ranges.join(", "),
      };
    });
  }, [selectedDates, selectedDatesArray, calendarDateMap]);

  // --- Effects ---

  useEffect(() => {
    let mounted = true;
    const fetchDates = async () => {
      setIsLoading(true);
      try {
        const from = format(currentMonth, "yyyy-MM-dd");
        const to = format(endOfMonth(addMonths(currentMonth, 1)), "yyyy-MM-dd");
        const data = await getCalendarDates(listingId, from, to);
        if (mounted) setCalendarDates(data);
      } catch (error) {
        console.error("Failed to fetch calendar dates:", error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    fetchDates();
    return () => {
      mounted = false;
    };
  }, [listingId, currentMonth]);

  useEffect(() => {
    if (selectedDates.size === 0) {
      setCustomPriceInput("");
      setNoteInput("");
      return;
    }
    const { commonPrice } = selectionStats;
    if (commonPrice != null) {
      setCustomPriceInput(commonPrice.toString());
    } else {
      setCustomPriceInput("");
    }
    // Handle note input
    if (isEditingRef.current) {
      isEditingRef.current = false;
      setIsNoteInputVisible(true);
      // Do not clear input, as it was set by the edit handler
    } else {
      setNoteInput("");
      setIsNoteInputVisible(false);
    }
  }, [selectedDates, selectionStats]);

  // --- Handlers ---

  const handlePrevMonth = useCallback(() => {
    if (isLoading) return;
    const prev = addMonths(currentMonth, -1);
    if (!isBefore(prev, startOfMonth(new Date()))) {
      setCurrentMonth(prev);
    }
  }, [currentMonth, isLoading]);

  const handleNextMonth = useCallback(() => {
    if (!isLoading) setCurrentMonth(addMonths(currentMonth, 1));
  }, [currentMonth, isLoading]);

  const toggleDateSelection = useCallback(
    (date: Date) => {
      const dateKey = getDateKey(date);
      const today = startOfDay(new Date());

      if (isBefore(date, today) || isDateBooked(date)) return;

      setSelectedDates((prev) => {
        const next = new Set(prev);
        if (next.has(dateKey)) next.delete(dateKey);
        else next.add(dateKey);
        return next;
      });
    },
    [isDateBooked],
  );

  const clearSelection = useCallback(() => {
    setSelectedDates(new Set());
    setCustomPriceInput("");
    setNoteInput("");
    setIsNoteInputVisible(false);
  }, []);

  const updateDates = useCallback(
    async (
      updates: Partial<{
        isBlocked: boolean;
        customPrice: number | null;
        note: string | null;
      }>,
      successMessage: string,
      shouldClearSelection = false,
    ) => {
      if (selectedDates.size === 0) return;

      // Determine note logic inside the callback to access latest state
      let finalUpdates = { ...updates };

      // Special handling for blocking to preserve notes if not explicitly changing them
      if (updates.isBlocked === true && updates.note === undefined) {
        let existingCommonNote: string | null = null;
        let hasMixedNotes = false;

        if (selectedDatesArray.length > 0) {
          const firstData = calendarDateMap.get(selectedDatesArray[0]);
          existingCommonNote = firstData?.note || null;

          for (let i = 1; i < selectedDatesArray.length; i++) {
            if (
              calendarDateMap.get(selectedDatesArray[i])?.note !==
              existingCommonNote
            ) {
              hasMixedNotes = true;
              break;
            }
          }
        }

        const noteToPreserve = !hasMixedNotes ? existingCommonNote : null;
        // Apply the input note if present, otherwise preserve existing if common, otherwise it might be cleared or left as is?
        // The API updates what is sent. If we send nothing for note, it might not change it (depending on backend).
        // Looking at API service: it sends what's in 'data'.
        // If the backend treats missing keys as "no change", we are good.
        // Looking at types: BulkUpdateCalendarDatesInput has optional keys.
        // Assuming backend updates only provided fields.

        // However, the original code had logic to PRESERVE note if blocking.
        // It calculated `finalNote = noteInput || noteToPreserve`.

        const finalNote = noteInput || noteToPreserve;
        if (finalNote) {
          finalUpdates.note = finalNote;
        }
      }

      startTransition(async () => {
        try {
          const updated = await updateCalendarDates(listingId, {
            dates: selectedDatesArray,
            ...finalUpdates,
          });

          setCalendarDates((prev) => {
            const map = new Map(prev.map((cd) => [cd.date.split("T")[0], cd]));
            for (const cd of updated) {
              map.set(cd.date.split("T")[0], cd);
            }
            return Array.from(map.values());
          });

          // Update inputs if needed
          if (updates.note !== undefined && updates.note !== null) {
            setNoteInput(updates.note);
          } else if (finalUpdates.note) {
            setNoteInput(finalUpdates.note);
          }

          if (updates.note === null) setNoteInput("");

          toast.success(successMessage);
          if (shouldClearSelection) clearSelection();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Update failed");
        }
      });
    },
    [
      listingId,
      selectedDates,
      selectedDatesArray,
      calendarDateMap,
      noteInput,
      clearSelection,
    ], // Added deps
  );

  const handleBlockParams = useCallback(
    (blocked: boolean) => {
      if (blocked) {
        // Logic handled inside updateDates for note preservation
        updateDates(
          { isBlocked: true },
          `${selectedDates.size} date(s) blocked`,
        );
      } else {
        updateDates(
          { isBlocked: false },
          `${selectedDates.size} date(s) unblocked`,
        );
      }
    },
    [updateDates, selectedDates.size],
  );

  const handleSetPrice = useCallback(() => {
    const price = parseFloat(customPriceInput);
    if (isNaN(price) || price < 10 || price > 100000) {
      toast.error("Price must be between 10 and 100,000");
      return;
    }
    updateDates(
      { customPrice: price },
      `Price set for ${selectedDates.size} date(s)`,
    );
  }, [customPriceInput, selectedDates.size, updateDates]);

  const handleClearPrice = useCallback(() => {
    updateDates({ customPrice: null }, `Custom price removed`, true);
  }, [updateDates]);

  const handleSetNote = useCallback(() => {
    updateDates({ note: noteInput || null }, `Note updated`);
  }, [noteInput, updateDates]);

  const handleEditNoteGroup = useCallback((note: string, dates: Date[]) => {
    isEditingRef.current = true;
    const newSelection = new Set(dates.map(getDateKey));
    setSelectedDates(newSelection);
    setNoteInput(note);
    setIsNoteInputVisible(true);
  }, []);

  const handleRemoveNoteGroup = useCallback(
    (dates: Date[]) => {
      const dateStrings = dates.map(getDateKey);
      // We need a separate direct call because updateDates depends on 'selectedDates' state
      // but here we might be removing a group that isn't fully selected.
      // Actually validation: "Handle remove note group"
      startTransition(async () => {
        try {
          const updated = await updateCalendarDates(listingId, {
            dates: dateStrings,
            note: null,
          });
          setCalendarDates((prev) => {
            const map = new Map(prev.map((cd) => [cd.date.split("T")[0], cd]));
            for (const cd of updated) map.set(cd.date.split("T")[0], cd);
            return Array.from(map.values());
          });
          // If editing these, clear input
          // Check intersection
          const hasSelected = dateStrings.some((d) => selectedDates.has(d));
          if (hasSelected) setNoteInput("");

          toast.success(`Notes removed for ${dates.length} date(s)`);
        } catch (e) {
          toast.error("Failed to remove notes");
        }
      });
    },
    [listingId, selectedDates],
  );

  const getDateData = useCallback(
    (date: Date): DateData => {
      const dateKey = getDateKey(date);
      const data = calendarDateMap.get(dateKey);
      const day = getDay(date);
      const isWeekend = day === 5 || day === 6;

      let price = basePrice || 0;
      if (data?.customPrice != null) price = data.customPrice;
      else if (isWeekend && weekendPrice) price = weekendPrice;

      return {
        price,
        isBlocked: !!data?.isBlocked,
        isBooked: isDateBooked(date),
        hasCustomPrice: data?.customPrice != null,
        hasNote: !!data?.note,
        note: data?.note,
      };
    },
    [calendarDateMap, basePrice, weekendPrice, isDateBooked],
  );

  return {
    currentMonth,
    isLoading,
    selectedDates,
    customPriceInput,
    noteInput,
    isPending,
    selectionStats,
    noteGroups,
    // Actions
    setCustomPriceInput,
    setNoteInput,
    handlePrevMonth,
    handleNextMonth,
    toggleDateSelection,
    clearSelection,
    handleBlockParams,
    handleSetPrice,
    handleClearPrice,
    handleSetNote,
    handleEditNoteGroup,
    handleRemoveNoteGroup,
    getDateData,
    isNoteInputVisible,
    setIsNoteInputVisible,
  };
}

// --- Memoized Components ---

const LegendItem = ({
  label,
  className,
  icon,
}: {
  label: string;
  className: string;
  icon?: React.ReactNode;
}) => {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "w-8 h-8 rounded-lg border flex items-center justify-center",
          className,
        )}
      >
        {icon}
      </div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
};

const CalendarDay = memo(
  ({
    date,
    isSelected,
    getDateData,
    onToggle,
    isPast,
    isToday,
  }: {
    date: Date;
    isSelected: boolean;
    getDateData: (d: Date) => DateData;
    onToggle: (d: Date) => void;
    isPast: boolean;
    isToday: boolean;
  }) => {
    const { price, isBlocked, isBooked, hasCustomPrice, hasNote } =
      getDateData(date);

    // Logic for disabled state:
    // - Past dates are disabled
    // - Booked dates are disabled (can't be selected for editing)
    // - Blocked dates are ENABLED (so you can select them to unblock or edit)
    const disabled = isPast || (isBooked && !isBlocked);

    return (
      <button
        onClick={() => onToggle(date)}
        disabled={disabled}
        className={cn(
          "w-full h-full aspect-square p-0.5 relative flex flex-col items-center justify-between transition-all duration-200 rounded-lg border",
          "hover:z-10 focus:z-10 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",

          // --- BASE STATE (Available) ---
          !isPast &&
            !isBlocked &&
            !isBooked &&
            !isSelected &&
            "bg-background border-border text-foreground hover:border-primary/50 hover:shadow-sm cursor-pointer",

          // --- PAST STATE ---
          isPast &&
            "bg-muted/10 border-none text-muted-foreground/30 cursor-not-allowed",

          // --- BLOCKED STATE (Manual) ---
          // Distinct solid background to show it's manually closed
          !isPast &&
            isBlocked &&
            !isSelected &&
            "bg-secondary/50 border-secondary text-muted-foreground cursor-pointer hover:bg-secondary/70 pattern-diagonal-lines",

          // --- BOOKED STATE (External) ---
          // "Sold" look - distinct from blocked
          isBooked &&
            "bg-destructive/5 border-none text-destructive/60 cursor-not-allowed decoration-destructive/30",

          // --- SELECTED STATE ---
          // Overrides all above
          isSelected &&
            "bg-primary border-primary text-primary-foreground shadow-md ring-1 ring-primary z-20 cursor-pointer",

          // Adjust radius for a softer look
          "rounded-xl overflow-hidden",
        )}
      >
        {/* Header: Day Number + Status Indicators */}
        <div className="w-full flex justify-between items-start px-1 pt-1">
          {/* Date Number */}
          <span
            className={cn(
              "text-xs font-medium flex items-center justify-center w-6 h-6 rounded-full transition-colors",
              // Today indicator
              isToday &&
                !isSelected &&
                "bg-primary/10 text-primary font-bold ring-1 ring-primary/20",
              isToday &&
                isSelected &&
                "bg-background/20 text-primary-foreground font-bold",

              // Dimmed text for blocked/past
              (isPast || isBooked) && !isToday && "font-normal",
              // Strikethrough on the day number for blocked/booked dates
              (isBlocked || isBooked) && "line-through decoration-current",
            )}
          >
            {format(date, "d")}
          </span>

          {/* Note Indicator (Top Right) */}
          {hasNote && (
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full shrink-0",
                isSelected ? "bg-primary-foreground" : "bg-primary",
                isPast && !isSelected && "bg-muted-foreground/30",
              )}
            />
          )}
        </div>

        {/* Footer: Price or Status Label */}
        <div className="w-full px-1 pb-1 text-center h-4 flex items-end justify-center">
          {/* Show Price ALWAYS (as requested), with styling adjustments */}
          <span
            className={cn(
              "text-[10px] leading-tight block truncate w-full",
              // Price Colors
              hasCustomPrice &&
                !isSelected &&
                !isBlocked &&
                "text-primary font-bold",

              // Blocked: muted
              isBlocked && !isSelected && "text-muted-foreground/80",

              // Default: muted
              !hasCustomPrice &&
                !isSelected &&
                !isBlocked &&
                "text-muted-foreground",

              // Selected: contrast
              isSelected && "text-primary-foreground/90",

              // Past or Booked: Dimmed/opacity
              (isPast || isBooked) && !isSelected && "opacity-50",
            )}
          >
            {price}
          </span>
        </div>
      </button>
    );
  },
  (prev, next) => {
    return (
      prev.isSelected === next.isSelected &&
      prev.date.getTime() === next.date.getTime() &&
      prev.getDateData === next.getDateData &&
      prev.onToggle === next.onToggle
    );
  },
);
CalendarDay.displayName = "CalendarDay";

const MonthView = memo(
  ({
    monthDate,
    selectedDates,
    getDateData,
    onToggle,
  }: {
    monthDate: Date;
    selectedDates: Set<string>;
    getDateData: (d: Date) => DateData;
    onToggle: (d: Date) => void;
  }) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startOffset = getDay(monthStart);
    const today = startOfDay(new Date());

    return (
      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-semibold text-center mb-4">
          {format(monthDate, "MMMM yyyy")}
        </h3>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          {days.map((day) => {
            const dateKey = getDateKey(day);
            return (
              <CalendarDay
                key={dateKey}
                date={day}
                isSelected={selectedDates.has(dateKey)}
                getDateData={getDateData}
                onToggle={onToggle}
                isPast={isBefore(day, today)}
                isToday={isSameDay(day, today)}
              />
            );
          })}
        </div>
      </div>
    );
  },
);
MonthView.displayName = "MonthView";

const MonthSkeleton = () => (
  <div className="min-w-0 flex-1">
    <div className="flex justify-center mb-4">
      <Skeleton className="h-6 w-32" />
    </div>
    <div className="grid grid-cols-7 gap-1 mb-2">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex justify-center py-2">
          <Skeleton className="h-3 w-8" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-7 gap-1">
      {Array.from({ length: 35 }).map((_, i) => (
        <Skeleton key={i} className="aspect-square rounded-lg" />
      ))}
    </div>
  </div>
);

// --- Component ---

export function ListingCalendar(props: ListingCalendarProps) {
  const {
    currentMonth,
    isLoading,
    selectedDates,
    customPriceInput,
    noteInput,
    isPending,
    selectionStats,
    noteGroups,
    setCustomPriceInput,
    setNoteInput,
    handlePrevMonth,
    handleNextMonth,
    toggleDateSelection,
    clearSelection,
    handleBlockParams,
    handleSetPrice,
    handleClearPrice,
    handleSetNote,
    handleEditNoteGroup,
    handleRemoveNoteGroup,
    getDateData,
    isNoteInputVisible,
    setIsNoteInputVisible,
  } = useListingCalendar(
    props.listingId,
    props.basePrice,
    props.weekendPrice,
    props.bookedDates,
  );

  return (
    <div className="space-y-6 mb-44 md:mb-30">
      {/* Header controls used to be here, but moved logic to hook */}
      <div className="pb-4">
        <div className="flex items-start justify-between">
          <p className="text-sm text-muted-foreground">
            Click on dates to select them, then use the action panel to block or
            set prices.
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevMonth}
              disabled={
                isBefore(
                  addMonths(currentMonth, -1),
                  startOfMonth(new Date()),
                ) || isLoading
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
              disabled={isLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-8 flex-col lg:flex-row">
        {isLoading ? (
          <>
            <MonthSkeleton />
            <MonthSkeleton />
          </>
        ) : (
          <>
            <MonthView
              monthDate={currentMonth}
              selectedDates={selectedDates}
              getDateData={getDateData}
              onToggle={toggleDateSelection}
            />
            <MonthView
              monthDate={addMonths(currentMonth, 1)}
              selectedDates={selectedDates}
              getDateData={getDateData}
              onToggle={toggleDateSelection}
            />
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 pt-6 pb-2 border-t border-border/50">
        <LegendItem
          label="Today"
          className="bg-background border-border aspect-square"
          icon={
            <div className="w-5 h-5 rounded-full bg-primary/10 ring-1 ring-primary/20 text-[10px] flex items-center justify-center font-bold text-primary">
              {format(new Date(), "d")}
            </div>
          }
        />

        <LegendItem
          label="Blocked"
          className="bg-secondary/50 border-secondary pattern-diagonal-lines aspect-square relative"
          icon={
            <span className="text-xs line-through decoration-current text-muted-foreground/50 font-normal">
              12
            </span>
          }
        />
        <LegendItem
          label="Booked"
          className="bg-destructive/5 border-none text-destructive/60 cursor-not-allowed decoration-destructive/30 aspect-square"
        />
        <LegendItem
          label="Has note"
          className="bg-background border-border aspect-square relative"
          icon={
            <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
          }
        />
      </div>

      {/* Action Panel */}
      <div
        data-state={selectedDates.size > 0 ? "open" : "closed"}
        className={cn(
          "fixed bottom-17 md:bottom-8 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl transform-gpu",
          "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          "data-[state=open]:translate-y-0 data-[state=open]:opacity-100",
          "data-[state=closed]:translate-y-24 data-[state=closed]:opacity-0 data-[state=closed]:pointer-events-none",
        )}
      >
        <div className="bg-background/90 backdrop-blur-2xl border border-border shadow-xl rounded-3xl p-3 sm:p-4 flex flex-col gap-0 overflow-hidden transition-all duration-300">
          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 w-full relative">
            {/* Selection Counter & Close (Mobile) */}
            <div className="flex items-center justify-between w-full sm:w-auto gap-4">
              <div className="flex items-center gap-2.5 bg-muted/40 rounded-full pl-1.5 pr-3 py-1.5 border border-border/50">
                <span className="bg-primary text-primary-foreground text-[10px] font-bold h-5 min-w-5 px-1.5 flex items-center justify-center rounded-full shadow-sm">
                  {selectedDates.size}
                </span>
                <span className="text-xs font-semibold text-foreground/80 tracking-tight uppercase">
                  Selected
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full sm:hidden hover:bg-muted text-muted-foreground"
                onClick={clearSelection}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="hidden sm:block h-8 w-px bg-border/50" />

            {/* Actions Toolbar */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 w-full sm:flex-1 pr-0">
              {/* Status Switch */}
              <div className="flex items-center gap-2 bg-muted/30 hover:bg-muted/50 transition-colors rounded-full pl-3 pr-1.5 py-1 border border-border/50 shrink-0">
                <Label
                  htmlFor="block-switch"
                  className={cn(
                    "text-xs font-medium cursor-pointer min-w-[50px] text-center transition-colors",
                    selectionStats.mixedBlockedStatus === "available"
                      ? "text-green-600 dark:text-green-400"
                      : selectionStats.mixedBlockedStatus === "blocked"
                        ? "text-muted-foreground"
                        : "",
                  )}
                >
                  {selectionStats.mixedBlockedStatus === "mixed"
                    ? "Mixed"
                    : selectionStats.mixedBlockedStatus === "blocked"
                      ? "Blocked"
                      : "Available"}
                </Label>

                <Switch
                  id="block-switch"
                  checked={
                    selectionStats.mixedBlockedStatus === "blocked" ||
                    selectionStats.mixedBlockedStatus === "mixed"
                  }
                  onCheckedChange={handleBlockParams}
                  disabled={isPending}
                  className={cn(
                    "scale-90 data-[state=unchecked]:bg-green-500/80 data-[state=unchecked]:hover:bg-green-500",
                    selectionStats.mixedBlockedStatus === "mixed" &&
                      "bg-yellow-500/50 data-[state=checked]:bg-yellow-500",
                  )}
                />
              </div>

              {/* Note Input */}
              {(selectionStats.mixedBlockedStatus === "blocked" ||
                selectionStats.mixedBlockedStatus === "mixed") && (
                <>
                  {isNoteInputVisible || noteInput ? (
                    <div className="flex items-center bg-background rounded-full border border-border/50 pl-3 pr-1 py-1 shadow-sm shrink-0 animate-in fade-in zoom-in-95 duration-200">
                      <Input
                        type="text"
                        placeholder="Note..."
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && !isPending && handleSetNote()
                        }
                        className="pl-1 h-6 w-24 sm:w-32 border-0 bg-transparent focus-visible:ring-0 shadow-none text-xs py-0"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleSetNote}
                        disabled={isPending}
                        className="h-6 w-6 p-0 rounded-full hover:bg-primary/10 hover:text-primary"
                        title="Save note"
                      >
                        <div className="h-2.5 w-2.5 bg-current rounded-full" />
                        <span className="sr-only">Save</span>
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsNoteInputVisible(true)}
                      className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent hover:border-border/50"
                      title="Add note"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span className="sr-only">Add Note</span>
                    </Button>
                  )}
                </>
              )}

              {/* Price Input */}
              <div className="flex items-center bg-background rounded-full border border-border/50 pl-3 pr-1 py-1 shadow-sm shrink-0 hover:border-border transition-colors">
                <Input
                  type="number"
                  placeholder="Price"
                  value={customPriceInput}
                  onChange={(e) => setCustomPriceInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    customPriceInput &&
                    !isPending &&
                    handleSetPrice()
                  }
                  className="pl-1 h-6 w-16 border-0 bg-transparent focus-visible:ring-0 shadow-none text-xs py-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min={10}
                  max={100000}
                  step="0.01"
                />

                <Button
                  size="sm"
                  onClick={handleSetPrice}
                  disabled={isPending || !customPriceInput}
                  className="h-6 px-2.5 text-[10px] ml-1 rounded-full font-semibold"
                >
                  Set
                </Button>
              </div>

              {selectionStats.hasCustomPrice && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearPrice}
                  disabled={isPending}
                  className="h-8 w-8 px-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full shrink-0 transition-colors"
                  title="Reset custom price"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full hidden sm:flex hover:bg-muted ml-auto shrink-0 text-muted-foreground"
              onClick={clearSelection}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Note Groups Display */}
          {noteGroups.length > 0 &&
            (selectionStats.mixedBlockedStatus === "blocked" ||
              selectionStats.mixedBlockedStatus === "mixed") && (
              <div className="w-full pt-3 mt-1 grid grid-cols-2 sm:grid-cols-3 gap-3 animate-in slide-in-from-top-2 duration-300">
                {noteGroups.map((group, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col min-w-0 group relative bg-muted/20 hover:bg-muted/40 border border-border/30 rounded-xl p-2.5 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-[10px] font-bold text-muted-foreground capitalize tracking-wider truncate flex-1">
                        {group.ranges}
                      </p>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-full hover:text-primary hover:bg-primary/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditNoteGroup(group.note, group.dates);
                          }}
                          title="Edit note"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-full hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveNoteGroup(group.dates);
                          }}
                          title="Delete note"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p
                      className="text-xs text-foreground font-medium truncate leading-relaxed"
                      title={group.note}
                    >
                      {group.note}
                    </p>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
