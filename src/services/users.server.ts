import { apiGet } from "@/lib/api";
import { User } from "@/types";

export const usersServerService = {
  getUsers: async (): Promise<User[]> => {
    const response = await apiGet<{ data: { users: User[] } }>("/admin/users");
    return response.data.users;
  },
};
