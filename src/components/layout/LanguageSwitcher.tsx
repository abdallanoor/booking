"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/navigation";
import { useSearchParams } from "next/navigation";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleLanguageChange = (newLocale: string) => {
    const params = searchParams.toString();
    const href = params ? `${pathname}?${params}` : pathname;

    // @ts-ignore - dynamic href with query params
    router.replace(href, { scroll: false, locale: newLocale });
  };

  const isEn = locale === "en";

  return (
    <DropdownMenuItem onClick={() => handleLanguageChange(isEn ? "ar" : "en")}>
      <Globe />
      {isEn ? "العربية" : "English"}
    </DropdownMenuItem>
  );
}
