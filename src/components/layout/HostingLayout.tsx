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
import { usePathname } from "next/navigation";

const hostingLinks = [
  {
    href: "/hosting",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    href: "/hosting/today",
    label: "Today",
    icon: ListTodo,
  },
  {
    href: "/hosting/listings",
    label: "Listings",
    icon: Building2,
  },
  {
    href: "/hosting/bookings",
    label: "Bookings",
    icon: Calendar,
  },
  {
    href: "/hosting/messages",
    label: "Messages",
    icon: MessageSquare,
  },
];

export function HostingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isWizardPage =
    pathname?.includes("/listings/new") || pathname?.endsWith("/edit");

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
