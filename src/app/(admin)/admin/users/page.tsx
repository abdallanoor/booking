import { usersServerService } from "@/services/users.server";
import AdminUsersClient from "./UsersClient";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await usersServerService.getUsers();

  return <AdminUsersClient initialUsers={users} />;
}
