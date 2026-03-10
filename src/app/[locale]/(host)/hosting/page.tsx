"use client";

import { useEffect, useState } from "react";
import { statsService } from "@/services/stats.service";
import { formatCurrency } from "@/lib/utils";
import { Link } from "@/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { HousePlus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { HostingStats } from "@/types";

export default function HostingPage() {
  const t = useTranslations("hosting");
  const [stats, setStats] = useState<HostingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await statsService.getHostingStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch hosting stats:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t("dashboard_title")}
            </h1>
            <p className="text-muted-foreground">{t("dashboard_desc")}</p>
          </div>
          <Button disabled size="lg">
            <HousePlus />
            {t("add_listing")}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border bg-card p-6">
              <Skeleton className="h-4 w-[130px] mb-2" />
              <Skeleton className="h-9 w-[90px] mb-2" />
              <Skeleton className="h-5 w-[170px]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("dashboard_title")}
          </h1>
          <p className="text-muted-foreground">{t("dashboard_desc")}</p>
        </div>
        <Button asChild size="lg">
          <Link href="/hosting/listings/new">
            <HousePlus />
            {t("add_listing")}
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title={t("active_listings")}
          value={stats.activeListings.toLocaleString()}
          description={t("active_listings_desc")}
        />
        <DashboardCard
          title={t("pending_bookings")}
          value={stats.pendingBookings.toLocaleString()}
          description={t("pending_bookings_desc")}
        />
        <DashboardCard
          title={t("upcoming_guests")}
          value={stats.upcomingGuests.toLocaleString()}
          description={t("upcoming_guests_desc")}
        />
        <DashboardCard
          title={t("total_earnings")}
          value={formatCurrency(stats.totalEarnings)}
          description={
            <span>
              {t("total_earnings_desc")}{" "}
              <span className="font-bold text-primary">{t("payout_soon")}</span>
            </span>
          }
        />
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card p-6">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      <div className="mt-2 text-xs text-muted-foreground">{description}</div>
    </div>
  );
}
