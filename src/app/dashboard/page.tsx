import { getDashboardStatsAction } from "@/actions";
import { DashboardStats } from "@/components/dashboard/Stats";
import { RecentBookings } from "@/components/dashboard/RecentBookings";

export default async function DashboardPage() {
  const stats = await getDashboardStatsAction();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening with your listings today.
        </p>
      </div>
      <DashboardStats stats={stats} />
      <RecentBookings bookings={stats.recentBookings || []} />
    </div>
  );
}
