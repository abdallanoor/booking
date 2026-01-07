import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { format, isValid, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, fromSmallestUnit?: boolean) {
  const egpAmount = amount / 100;
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
  }).format(fromSmallestUnit ? egpAmount : amount);
}

export function formatDate(
  date: string | Date | null | undefined,
  formatStr:
    | "PPP"
    | "PP"
    | "P"
    | "PPP p"
    | "full"
    | "short"
    | "withTime"
    | string = "PPP"
) {
  if (!date) return "N/A";

  const d = typeof date === "string" ? parseISO(date) : date;

  if (!isValid(d)) {
    // Try native Date as fallback for non-ISO strings
    const nativeDate = new Date(date as string);
    if (!isValid(nativeDate)) return "Invalid Date";

    return format(nativeDate, getPreset(formatStr));
  }

  return format(d, getPreset(formatStr));
}

function getPreset(formatStr: string): string {
  const presets: Record<string, string> = {
    full: "EEEE, MMMM do, yyyy",
    fullDate: "EEE, MMM d, yyyy",
    short: "MMM d, yyyy",
    withTime: "MMM d, yyyy HH:mm",
    dateTime: "PPP 'at' p",
  };

  return presets[formatStr] || formatStr;
}
