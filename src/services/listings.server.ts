import { apiGet } from "@/lib/api";
import { Listing } from "@/types";

export const listingsServerService = {
  getHostListings: async (
    page: number = 1,
    limit: number = 10
  ): Promise<{ listings: Listing[]; pagination: any }> => {
    const response = await apiGet<{
      data: { listings: Listing[]; pagination: any };
    }>(`/listings?dashboard=true&page=${page}&limit=${limit}`);
    return {
      listings: response.data.listings,
      pagination: response.data.pagination,
    };
  },
};
