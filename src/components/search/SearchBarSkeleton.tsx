import { Search } from "lucide-react";

export function SearchBarSkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row h-auto md:h-16 bg-card rounded-2xl md:rounded-full border shadow-lg divide-y md:divide-y-0 overflow-hidden md:overflow-visible">
        {/* Location Placeholder */}
        <div className="relative flex-1 px-6 py-3 md:py-0 w-full md:w-auto flex flex-col justify-center h-full">
          <div className="h-3.5 w-12 bg-muted/60 rounded animate-pulse mb-1" />
          <div className="h-5 w-32 bg-muted/40 rounded animate-pulse" />
        </div>

        {/* Dates Placeholder */}
        <div className="relative flex-1 px-6 py-3 md:py-0 w-full md:w-auto flex flex-col justify-center h-full">
          {/* Desktop Separator Imitation */}
          <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 h-8 w-px bg-border" />

          <div className="h-3.5 w-10 bg-muted/60 rounded animate-pulse mb-1" />
          <div className="h-5 w-24 bg-muted/40 rounded animate-pulse" />
        </div>

        {/* Guests Placeholder */}
        <div className="relative flex-[1.2] pr-2 py-2 md:py-0 flex items-center justify-between w-full md:w-auto h-full">
          {/* Desktop Separator Imitation */}
          <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 h-8 w-px bg-border" />

          <div className="flex-1 pl-6 flex flex-col justify-center">
            <div className="h-3 w-8 bg-muted/60 rounded animate-pulse mb-1" />
            <div className="h-3.5 w-16 bg-muted/40 rounded animate-pulse" />
          </div>
          <div className="rounded-full h-12 w-12 shrink-0 ml-2 bg-primary/20 flex items-center justify-center">
            <Search className="h-5 w-5 text-primary/40" />
          </div>
        </div>
      </div>
    </div>
  );
}
