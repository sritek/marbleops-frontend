import type { Config } from "tailwindcss";

/**
 * MarbleOps Design System - Tailwind Configuration
 *
 * This is a minimal config file for Tailwind v4.
 * Most theming is done via CSS variables in globals.css using @theme blocks.
 */
const config: Config = {
  // ---------------------------------------------------------------------------
  // Content Paths
  // ---------------------------------------------------------------------------
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],

  // ---------------------------------------------------------------------------
  // Dark Mode
  // ---------------------------------------------------------------------------
  darkMode: "class",

  // ---------------------------------------------------------------------------
  // Theme Extension
  // ---------------------------------------------------------------------------
  theme: {
    extend: {
      // Font family - Inter as primary
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "sans-serif",
        ],
      },

      // Max width for content containers
      maxWidth: {
        content: "1400px",
      },

      // Sidebar width
      width: {
        sidebar: "240px",
      },

      // Minimum touch target size (WCAG compliance)
      minHeight: {
        touch: "44px",
      },
      minWidth: {
        touch: "44px",
      },

      // Animation for loading states
      animation: {
        shimmer: "shimmer 1.5s infinite",
        "spin-slow": "spin 2s linear infinite",
      },

      // Custom keyframes
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },

  // ---------------------------------------------------------------------------
  // Plugins
  // ---------------------------------------------------------------------------
  plugins: [],
};

export default config;
