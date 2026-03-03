"use client";

import { useEffect, useState } from "react";
import { statsService } from "@/services/stats.service";
import { formatCurrency } from "@/lib/utils";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminStats } from "@/types";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await statsService.getAdminStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of platform activity and management tools.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border bg-card p-6">
              <Skeleton className="h-5 w-[120px] mb-2" />
              <Skeleton className="h-9 w-[80px] mb-1" />
              <Skeleton className="h-4 w-[160px]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of platform activity and management tools.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AdminCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          description="Registered users"
        />
        <AdminCard
          title="Active Listings"
          value={stats.activeListings.toLocaleString()}
          description={
            <span className="flex items-center">
              Published listings
              {stats.pendingListings > 0 && (
                <span className="ml-2 flex items-center text-amber-500">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  {stats.pendingListings} pending
                </span>
              )}
              <Link href="/admin/listings" className="ms-auto">
                <Button size="sm" className="h-7 text-xs">
                  Review
                </Button>
              </Link>
            </span>
          }
        />
        <AdminCard
          title="Total Bookings"
          value={stats.totalBookings.toLocaleString()}
          description="All time bookings"
        />
        <AdminCard
          title="Revenue"
          value={formatCurrency(stats.revenue)}
          description="Platform earnings"
        />
        <AdminCard
          title="Identity Verifications"
          value={stats.pendingVerifications.toLocaleString()}
          description={
            <span className="flex items-center justify-between">
              <span>
                {stats.pendingVerifications > 0
                  ? "Pending review"
                  : "No pending requests"}
              </span>
              <Link href="/admin/verifications">
                <Button size="sm" className="h-7 text-xs">
                  Review
                </Button>
              </Link>
            </span>
          }
        />
      </div>
    </div>
  );
}

function AdminCard({
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
      <div className="mt-1 text-xs text-muted-foreground">{description}</div>
    </div>
  );
}
