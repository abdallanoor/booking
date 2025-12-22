"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Building2, Calendar, ListTodo } from "lucide-react";

export function DashboardBottomNav() {
  const pathname = usePathname();

  const routes = [
    {
      href: "/dashboard",
      label: "Overview",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      href: "/dashboard/today",
      label: "Today",
      icon: ListTodo,
      active: pathname === "/dashboard/today",
    },
    {
      href: "/dashboard/listings",
      label: "Listings",
      icon: Building2,
      active: pathname.startsWith("/dashboard/listings"),
    },
    {
      href: "/dashboard/bookings",
      label: "Bookings",
      icon: Calendar,
      active: pathname.startsWith("/dashboard/bookings"),
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t flex md:hidden items-center justify-around px-2 pb-2">
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "flex flex-col items-center justify-center gap-1 w-full h-full",
            route.active
              ? "text-primary"
              : "text-muted-foreground hover:text-primary transition-colors"
          )}
        >
          <route.icon className="h-5 w-5" />
          <span className="text-[10px] font-medium">{route.label}</span>
        </Link>
      ))}
    </div>
  );
}
