"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useRouter } from "@/navigation";
import { ListingForm } from "@/components/hosting/ListingForm";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";

export default function NewListingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const t = useTranslations("listings_pages");
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/login");
      } else if (user.role !== "Host" && user.role !== "Admin") {
        router.push("/hosting");
      } else {
        setIsAuthorized(true);
      }
    }
  }, [user, loading, router]);

  if (loading || !isAuthorized) {
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
            {t("create_title")}
          </h1>
        </div>
      </div>
      <ListingForm mode="create" />
    </div>
  );
}
