"use client";

import { useEffect, useState, use } from "react";
import { Link, useRouter } from "@/navigation";
import { getListing } from "@/services/listings.service";
import { useAuth } from "@/contexts/AuthContext";
import { ListingForm } from "@/components/hosting/ListingForm";
import { Button } from "@/components/ui/button";
import { ChevronLeft, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Listing } from "@/types";

export default function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, loading: userLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations("listings_pages");

  const [listing, setListing] = useState<Listing | null>(null);
  const [loadingListing, setLoadingListing] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (userLoading) return;

    if (!user) {
      router.push("/auth/login");
      return;
    }

    const fetchListing = async () => {
      try {
        const fetchedListing = await getListing(id, undefined, true);

        if (!fetchedListing) {
          router.push("/hosting/listings");
          return;
        }

        // Verify ownership
        const hostId = fetchedListing.host._id.toString();
        const userId = user.id?.toString() || (user as any)._id?.toString();

        if (hostId !== userId && user.role !== "Admin") {
          router.push("/hosting/listings");
          return;
        }

        setListing(fetchedListing);
        setIsAuthorized(true);
      } catch (error) {
        console.error("Failed to fetch listing:", error);
        router.push("/hosting/listings");
      } finally {
        setLoadingListing(false);
      }
    };

    fetchListing();
  }, [id, user, userLoading, router]);

  if (userLoading || loadingListing || !isAuthorized || !listing) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center py-5 gap-4">
        <Link href="/hosting/listings">
          <Button variant="secondary" size="icon" className="rounded-full">
            <ChevronLeft className="rtl:rotate-180" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("edit_title")}
          </h1>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
            {t("edit_notice")}
          </p>
        </div>
      </div>

      <ListingForm listing={listing} mode="edit" />
    </div>
  );
}
