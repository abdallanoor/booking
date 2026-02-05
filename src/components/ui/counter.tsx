"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CounterProps {
  value?: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export function Counter({
  value = 0,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  className,
}: CounterProps) {
  const increment = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    if (value < max) {
      // Fix floating point precision issues
      const nextValue = Math.round((value + step) * 100) / 100;
      onChange(Math.min(nextValue, max)); // Ensure we don't exceed max due to rounding
    }
  };

  const decrement = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    if (value > min) {
      // Fix floating point precision issues
      const nextValue = Math.round((value - step) * 100) / 100;
      onChange(Math.max(nextValue, min)); // Ensure we don't go below min due to rounding
    }
  };

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-full border-muted-foreground/30 hover:border-foreground hover:bg-background shadow-none"
        onClick={decrement}
        disabled={value <= min}
        type="button"
      >
        <Minus className="h-4 w-4" />
        <span className="sr-only">Decrease</span>
      </Button>
      <div className="font-medium min-w-8 text-center tabular-nums">
        {value}
      </div>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-full border-muted-foreground/30 hover:border-foreground hover:bg-background shadow-none"
        onClick={increment}
        disabled={value >= max}
        type="button"
      >
        <Plus className="h-4 w-4" />
        <span className="sr-only">Increase</span>
      </Button>
    </div>
  );
}
