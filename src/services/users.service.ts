import { clientPatch } from "@/lib/api-client";
import { apiGet } from "@/lib/api";
import { User } from "@/types";

// Client-side service (for use in client components)
export const usersService = {
  getAdminUsers: async (
    page: number = 1,
    limit: number = 10,
    status?: string,
    search?: string
  ): Promise<{ users: User[]; pagination: any }> => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (status) params.append("status", status);
    if (search) params.append("search", search);

    const response = await apiGet<{
      data: { users: User[]; pagination: any };
    }>(`/admin/users?${params.toString()}`);

    return {
      users: response.data.users || [],
      pagination: response.data.pagination || { page: 1, limit: 10, total: 0, pages: 1 }
    };
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await clientPatch<{ data: { user: User } }>(
      `/admin/users/${id}`,
      data
    );
    return response.data.user;
  },
};
