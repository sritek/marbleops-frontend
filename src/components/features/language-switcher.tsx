"use client";

import * as React from "react";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { config } from "@/config";
import { locales, localeNames, type Locale } from "@/lib/i18n";

/**
 * Language switcher component
 */
export function LanguageSwitcher() {
  const [currentLocale, setCurrentLocale] = React.useState<Locale>("en");

  // Load saved locale on mount
  React.useEffect(() => {
    const saved = localStorage.getItem(config.storage.localeKey) as Locale;
    if (saved && locales.includes(saved)) {
      setCurrentLocale(saved);
    }
  }, []);

  const handleChange = (locale: Locale) => {
    setCurrentLocale(locale);
    localStorage.setItem(config.storage.localeKey, locale);
    // In a full implementation with next-intl routing:
    // router.replace(addLocalePrefix(pathname, locale));
    // For now, we'll just save the preference
    window.location.reload();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Change language">
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleChange(locale)}
            className={locale === currentLocale ? "bg-bg-muted" : ""}
          >
            {localeNames[locale]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
