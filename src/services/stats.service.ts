import { apiGet } from "@/lib/api";

export interface AdminStats {
  totalUsers: number;
  activeListings: number;
  pendingListings: number;
  totalBookings: number;
  revenue: number;
}

export interface HostingStats {
  activeListings: number;
  pendingBookings: number;
  upcomingGuests: number;
  totalEarnings: number;
}

export const statsService = {
  getAdminStats: async (): Promise<AdminStats> => {
    const response = await apiGet<{ data: { stats: AdminStats } }>(
      "/admin/stats",
      {
        revalidate: 0,
        tags: ["admin-stats"],
      }
    );
    return response.data.stats;
  },

  getHostingStats: async (): Promise<HostingStats> => {
    const response = await apiGet<{ data: { stats: HostingStats } }>(
      "/hosting/stats",
      {
        revalidate: 0,
        tags: ["hosting-stats"],
      }
    );
    return response.data.stats;
  },
};
