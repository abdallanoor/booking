import { Suspense } from "react";
import { DynamicSearchBar } from "@/components/search/DynamicSearchBar";

import { SearchBarSkeleton } from "@/components/search/SearchBarSkeleton";
import FeaturedListings from "@/components/home/FeaturedListings";

export default function Home() {
  return (
    <main className="container py-8">
      <div className="space-y-8">
        {/* Search Bar */}
        <Suspense fallback={<SearchBarSkeleton />}>
          <DynamicSearchBar />
        </Suspense>

        <FeaturedListings />
      </div>
    </main>
  );
}
