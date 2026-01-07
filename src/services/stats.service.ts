import { apiGet } from "@/lib/api";
import type { AdminStats, HostingStats } from "@/types";

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
