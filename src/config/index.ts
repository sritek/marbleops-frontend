/**
 * Application configuration
 */
export const config = {
  app: {
    name: "MarbleOps",
    tagline: "Stone Business Operations",
    version: "1.0.0",
  },
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
    timeout: 30000,
  },
  storage: {
    tokenKey: "marbleops_token",
    userKey: "marbleops_user",
    storeKey: "marbleops_store",
    localeKey: "marbleops_locale",
    themeKey: "marbleops_theme",
  },
  defaults: {
    locale: "en",
    theme: "system",
    pageSize: 20,
  },
} as const;
