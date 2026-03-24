import { SearchBarSkeleton } from "@/components/search/SearchBarSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container py-8">
      <div className="space-y-8">
        {/* Search Bar */}
        <SearchBarSkeleton />

        {/* Results */}
        <div>
          <Skeleton className="h-8 w-48 mb-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-4/3 w-full rounded-2xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
