import { apiGet } from "@/lib/api";
import type { AdminStats, HostingStats } from "@/types";

export const statsService = {
  getAdminStats: async (): Promise<AdminStats> => {
    const response = await apiGet<{ data: { stats: AdminStats } }>(
      "/admin/stats"
    );
    return response.data.stats;
  },

  getHostingStats: async (): Promise<HostingStats> => {
    const response = await apiGet<{ data: { stats: HostingStats } }>(
      "/hosting/stats"
    );
    return response.data.stats;
  },
};
