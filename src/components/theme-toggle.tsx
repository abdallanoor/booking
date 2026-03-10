"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useTranslations } from "next-intl";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("theme");

  const isDark = theme === "dark";

  return (
    <DropdownMenuItem onClick={() => setTheme(isDark ? "light" : "dark")}>
      {isDark ? (
        <>
          <Sun />
          {t("light")}
        </>
      ) : (
        <>
          <Moon />
          {t("dark")}
        </>
      )}
    </DropdownMenuItem>
  );
}
