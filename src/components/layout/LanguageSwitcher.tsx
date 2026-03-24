"use client";

import { useLocale } from "next-intl";
import { usePathname } from "@/navigation";
import { useSearchParams } from "next/navigation";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleLanguageChange = (newLocale: string) => {
    const params = searchParams.toString();
    const basePath = pathname === "/" ? "" : pathname;
    const queryString = params ? `?${params}` : "";

    window.location.href = `/${newLocale}${basePath}${queryString}`;
  };

  const isEn = locale === "en";

  return (
    <DropdownMenuItem onClick={() => handleLanguageChange(isEn ? "ar" : "en")}>
      <Globe />
      {isEn ? "العربية" : "English"}
    </DropdownMenuItem>
  );
}
