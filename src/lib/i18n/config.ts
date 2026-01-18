/**
 * Internationalization configuration
 */

export const locales = ["en", "hi"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  hi: "हिंदी",
};

/**
 * Get locale from path or default
 */
export function getLocaleFromPath(pathname: string): Locale {
  const segments = pathname.split("/");
  const potentialLocale = segments[1] as Locale;

  if (locales.includes(potentialLocale)) {
    return potentialLocale;
  }

  return defaultLocale;
}

/**
 * Remove locale prefix from path
 */
export function removeLocalePrefix(pathname: string): string {
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return pathname.slice(locale.length + 1) || "/";
    }
  }
  return pathname;
}

/**
 * Add locale prefix to path
 */
export function addLocalePrefix(pathname: string, locale: Locale): string {
  const cleanPath = removeLocalePrefix(pathname);
  return `/${locale}${cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`}`;
}
