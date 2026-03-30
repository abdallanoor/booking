import { cn } from "@/lib/utils";

interface LoadingDotsProps {
  className?: string;
  dotClassName?: string;
}

export function LoadingDots({ className, dotClassName }: LoadingDotsProps) {
  return (
    <div
      className={cn("flex items-center justify-center space-x-1.5", className)}
    >
      <span className="sr-only">Loading...</span>
      <div
        className={cn(
          "h-1.5 w-1.5 animate-dot-pulse rounded-full bg-primary [animation-delay:-0.32s]",
          dotClassName,
        )}
      ></div>
      <div
        className={cn(
          "h-1.5 w-1.5 animate-dot-pulse rounded-full bg-primary [animation-delay:-0.16s]",
          dotClassName,
        )}
      ></div>
      <div
        className={cn(
          "h-1.5 w-1.5 animate-dot-pulse rounded-full bg-primary",
          dotClassName,
        )}
      ></div>
    </div>
  );
}
