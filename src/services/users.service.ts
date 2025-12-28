import { clientPatch } from "@/lib/api-client";
import { User } from "@/types";

// Client-side service (for use in client components)
export const usersService = {
  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await clientPatch<{ data: { user: User } }>(
      `/admin/users/${id}`,
      data
    );
    return response.data.user;
  },
};
