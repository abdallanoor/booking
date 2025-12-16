import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth/jwt";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { Sidebar } from "@/components/dashboard/Sidebar";

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
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
        {children}
      </main>
    </div>
  );
}
