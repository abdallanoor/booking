import { statsService } from "@/services/stats.service";
import { formatCurrency } from "@/lib/utils";
import { WalletAndPayoutsSection } from "@/components/payouts/WalletAndPayoutsSection";

export default async function HostingPage() {
  const stats = await statsService.getHostingStats();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
        <p className="text-muted-foreground">
          Manage your listings, bookings, and more from your hosting dashboard.
        </p>
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
          description="Lifetime earnings"
        />
      </div>

      <WalletAndPayoutsSection />
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
  description: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
