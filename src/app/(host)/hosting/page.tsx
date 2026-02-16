import { statsService } from "@/services/stats.service";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HousePlus } from "lucide-react";

export default async function HostingPage() {
  const stats = await statsService.getHostingStats();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
          <p className="text-muted-foreground">
            Manage your listings, bookings, and more from your hosting
            dashboard.
          </p>
        </div>
        <Button asChild>
          <Link href="/hosting/listings/new">
            <HousePlus />
            Add Listing
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Active Listings"
          value={stats.activeListings.toLocaleString()}
          description="Your published listings"
        />
        <DashboardCard
          title="Pending Bookings"
          value={stats.pendingBookings.toLocaleString()}
          description="Awaiting your response"
        />
        <DashboardCard
          title="Upcoming Guests"
          value={stats.upcomingGuests.toLocaleString()}
          description="Check-ins this week"
        />
        <DashboardCard
          title="Total Earnings"
          value={formatCurrency(stats.totalEarnings)}
          description={
            <span>
              Lifetime earnings{" "}
              <span className="font-bold text-primary">
                (Payout coming soon!)
              </span>
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
    <div className="rounded-lg border bg-card p-6">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      <div className="mt-1 text-xs text-muted-foreground">{description}</div>
    </div>
  );
}
