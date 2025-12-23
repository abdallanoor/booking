import { statsService } from "@/services/stats.service";
import { formatCurrency } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

export default async function AdminDashboardPage() {
  const stats = await statsService.getAdminStats();

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
    <div className="rounded-lg border bg-card p-6">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      <div className="mt-1 text-xs text-muted-foreground">{description}</div>
    </div>
  );
}
