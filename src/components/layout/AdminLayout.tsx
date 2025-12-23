"use client";

import { SectionProvider } from "@/contexts/SectionContext";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { LayoutDashboard, Building2, Users, CalendarCheck } from "lucide-react";

const adminLinks = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/listings",
    label: "Listings",
    icon: Building2,
  },
  {
    href: "/admin/bookings",
    label: "Bookings",
    icon: CalendarCheck,
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: Users,
  },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SectionProvider section="admin">
      <div className="min-h-screen pb-20">
        <Header links={adminLinks} />
        <main className="container pt-8">{children}</main>
        <BottomNav links={adminLinks} />
      </div>
    </SectionProvider>
  );
}
