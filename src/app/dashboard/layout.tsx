import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth/jwt";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { Header } from "@/components/layout/Header";
import { DashboardBottomNav } from "@/components/dashboard/DashboardBottomNav";

export default async function DashboardLayout({
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

  // Restrict access to Host and Admin only
  if (user.role !== "Host" && user.role !== "Admin") {
    // If Guest, maybe redirect to home or become-host
    redirect("/");
  }

  return (
    <div className="min-h-screen pb-20">
      <Header />
      <main className="container pt-8">{children}</main>
      <DashboardBottomNav />
    </div>
  );
}
