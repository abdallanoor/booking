import { apiGet } from "@/lib/api";
import type { User } from "./users.service";

// Server-side service (for use in server components)
export const usersServerService = {
  getUsers: async (): Promise<User[]> => {
    const response = await apiGet<{ data: { users: User[] } }>("/admin/users", {
      revalidate: 0,
      tags: ["admin-users"],
    });
    return response.data.users;
  },
};
