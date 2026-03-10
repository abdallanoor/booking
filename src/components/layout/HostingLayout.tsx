"use client";

import { SectionProvider } from "@/contexts/SectionContext";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import {
  LayoutDashboard,
  Building2,
  Calendar,
  ListTodo,
  MessageSquare,
} from "lucide-react";
import { usePathname } from "@/navigation";

import { useTranslations } from "next-intl";

export function HostingLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const isWizardPage =
    pathname?.includes("/listings/new") || pathname?.endsWith("/edit");

  const hostingLinks = [
    {
      href: "/hosting",
      label: t("overview"),
      icon: LayoutDashboard,
    },
    {
      href: "/hosting/today",
      label: t("today"),
      icon: ListTodo,
    },
    {
      href: "/hosting/listings",
      label: t("listings"),
      icon: Building2,
    },
    {
      href: "/hosting/bookings",
      label: t("bookings"),
      icon: Calendar,
    },
    {
      href: "/hosting/messages",
      label: t("messages"),
      icon: MessageSquare,
    },
  ];

  if (isWizardPage) {
    return (
      <SectionProvider section="hosting">
        <main className="min-h-screen container">{children}</main>
      </SectionProvider>
    );
  }

  return (
    <SectionProvider section="hosting">
      <div className="min-h-screen pb-20">
        <Header links={hostingLinks} />
        <main className="container pt-8">{children}</main>
        <BottomNav links={hostingLinks} />
      </div>
    </SectionProvider>
  );
}
