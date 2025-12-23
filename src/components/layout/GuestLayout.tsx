"use client";

import { SectionProvider } from "@/contexts/SectionContext";
import { Header } from "@/components/layout/Header";

export function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <SectionProvider section="guest">
      <Header />
      {children}
    </SectionProvider>
  );
}
