import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="container max-w-6xl! py-6 animate-pulse">
      {/* Header Section Skeleton */}
      <div className="mb-6 flex justify-between items-center gap-4">
        <Skeleton className="h-8 w-2/3 max-w-[400px]" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9 md:w-24 rounded-full" />
          <Skeleton className="h-9 w-9 md:w-24 rounded-full" />
        </div>
      </div>

      {/* Images Carousel Skeleton */}
      <div className="mb-8 rounded-3xl overflow-hidden relative">
        <Skeleton className="relative aspect-4/3 sm:aspect-video max-h-80 w-full" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-8 gap-12 relative">
        {/* Left Column: Details Skeleton */}
        <div className="lg:col-span-5 space-y-8">
          {/* Title & Stats Skeleton */}
          <div className="border-b pb-6">
            <Skeleton className="h-6 w-3/4 mb-4" />
            <div className="flex gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>

          {/* Host Section Skeleton */}
          <div className="border-b pb-6 flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>

          {/* Description Skeleton */}
          <div className="border-b pb-6 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>

          {/* Amenities Skeleton */}
          <div className="border-b pb-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="grid grid-cols-2 gap-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Booking Card Skeleton */}
        <div className="relative lg:col-span-3">
          <div className="sticky top-8">
            <Skeleton className="w-full h-72 rounded-2xl" />
          </div>
        </div>
      </div>
    </main>
  );
}
