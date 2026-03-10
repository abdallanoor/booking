import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth/jwt";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { AdminLayout } from "@/components/layout/AdminLayout";

export default async function AdminRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/auth/login");
  }

  const payload = verifyToken(token);
  if (!payload) {
    redirect("/auth/login");
  }

  await dbConnect();
  const user = await User.findById(payload.userId).lean();

  if (!user) {
    redirect("/auth/login");
  }

  // Restrict access to Admin only
  if (user.role !== "Admin") {
    redirect("/");
  }

  return <AdminLayout>{children}</AdminLayout>;
}
