"use client";

import { Header } from "@/components/layout/Header";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}
