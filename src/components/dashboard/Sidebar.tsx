"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Building2, CalendarDays, LogOut } from "lucide-react";
import { logoutAction } from "@/actions";
import { startTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const routes = [
    {
      href: "/dashboard",
      label: "Overview",
      icon: LayoutDashboard,
      roles: ["Admin", "Host"],
    },
    {
      href: "/dashboard/properties",
      label: "Properties",
      icon: Building2,
      roles: ["Admin", "Host"],
    },
    {
      href: "/dashboard/bookings",
      label: "Bookings",
      icon: CalendarDays,
      roles: ["Admin", "Host"],
    },
    // Admin specific routes could be added here if needed, e.g.
    // {
    //   href: "/dashboard/users",
    //   label: "Users",
    //   icon: Users,
    //   roles: ["Admin"],
    // }
  ];

  const filteredRoutes = routes.filter((route) =>
    route.roles.includes(user.role)
  );

  const handleLogout = () => {
    startTransition(async () => {
      try {
        await logoutAction();
        await logout();
        toast.success("Logged out successfully");
        router.push("/");
      } catch {
        toast.error("Failed to logout");
      }
    });
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background">
      <div className="flex h-full flex-col px-3 py-4">
        <div className="mb-8 flex items-center px-2">
          <Link href="/" className="text-xl font-bold text-primary">
            Booking Dashboard
          </Link>
        </div>

        <nav className="space-y-1 flex-1">
          {filteredRoutes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                pathname === route.href
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
              )}
            >
              <route.icon className="h-4 w-4" />
              {route.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t pt-4">
          <div className="px-3 py-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {user.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm font-medium">
                  {user.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
            </div>

            <button
              onClick={() => handleLogout()}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-red-500/10 hover:text-red-500"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
