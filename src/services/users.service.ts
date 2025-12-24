import { clientDelete, clientPatch } from "@/lib/api-client";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "Guest" | "Host" | "Admin";
  provider: "local" | "google";
  emailVerified: boolean;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// Client-side service (for use in client components)
export const usersService = {
  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await clientPatch<{ data: { user: User } }>(
      `/admin/users/${id}`,
      data
    );
    return response.data.user;
  },

  deleteUser: async (id: string): Promise<void> => {
    await clientDelete(`/admin/users/${id}`);
  },
};
