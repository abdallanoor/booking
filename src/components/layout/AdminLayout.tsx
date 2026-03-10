"use client";

import { SectionProvider } from "@/contexts/SectionContext";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { LayoutDashboard, Building2, Users, CalendarCheck } from "lucide-react";

import { useTranslations } from "next-intl";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("nav");

  const adminLinks = [
    {
      href: "/admin",
      label: t("dashboard"),
      icon: LayoutDashboard,
    },
    {
      href: "/admin/listings",
      label: t("listings"),
      icon: Building2,
    },
    {
      href: "/admin/bookings",
      label: t("bookings"),
      icon: CalendarCheck,
    },
    {
      href: "/admin/users",
      label: t("users"),
      icon: Users,
    },
  ];

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
