"use client";

import React, { createContext, useContext } from "react";

export type Section = "guest" | "hosting" | "admin";

interface SectionContextType {
  section: Section;
}

const SectionContext = createContext<SectionContextType | undefined>(undefined);

export function SectionProvider({
  section,
  children,
}: {
  section: Section;
  children: React.ReactNode;
}) {
  return (
    <SectionContext.Provider value={{ section }}>
      {children}
    </SectionContext.Provider>
  );
}

export function useSection(): Section {
  const context = useContext(SectionContext);
  // Default to guest if no context (fallback for pages outside route groups)
  return context?.section ?? "guest";
}
