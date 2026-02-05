import { apiGet } from "@/lib/api";
import { Listing } from "@/types";

export const listingsServerService = {
  getHostListings: async (): Promise<Listing[]> => {
    const response = await apiGet<{ data: { listings: Listing[] } }>(
      "/listings?dashboard=true"
    );
    return response.data.listings;
  },
};
