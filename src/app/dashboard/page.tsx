import { getDashboardStatsAction } from "@/actions";
import { DashboardStats } from "@/components/dashboard/Stats";

export default async function DashboardPage() {
  const stats = await getDashboardStatsAction();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your activity and performance.
        </p>
      </div>
      <DashboardStats stats={stats} />
    </div>
  );
}
