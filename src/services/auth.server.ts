import { apiGet } from "@/lib/api";
import { User } from "@/types";

export const authServerService = {
  getUser: async (): Promise<User> => {
    const response = await apiGet<{ data: { user: User } }>("/auth/me", {
      revalidate: 0,
      tags: ["user"],
    });
    return response.data.user;
  },
};
