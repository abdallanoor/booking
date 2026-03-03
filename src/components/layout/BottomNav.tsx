"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { BottomNavLink } from "@/types";

interface BottomNavProps {
  links: BottomNavLink[];
}

export function BottomNav({ links }: BottomNavProps) {
  const pathname = usePathname();

  // Find the best matching link (the longest one that matches the current pathname)
  const activeLink = links
    .filter(
      (l) =>
        pathname === l.href ||
        (l.href !== "/" && pathname.startsWith(l.href + "/")),
    )
    .sort((a, b) => b.href.length - a.href.length)[0];

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t flex md:hidden items-center justify-around px-2 pb-2">
      {links.map((link) => {
        const isActive = activeLink?.href === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 w-full h-full",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-primary transition-colors",
            )}
          >
            <link.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{link.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
