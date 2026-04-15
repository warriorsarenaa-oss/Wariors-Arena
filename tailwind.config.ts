import type { Config } from "tailwindcss";
import { designTokens } from "./lib/designTokens";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: designTokens.colors.primary,
        primaryDark: designTokens.colors.primaryDark,
        accent: designTokens.colors.accent,
        dark: designTokens.colors.dark,
        darkSurface: designTokens.colors.darkSurface,
        darkBorder: designTokens.colors.darkBorder,
        textPrimary: designTokens.colors.textPrimary,
        textSecondary: designTokens.colors.textSecondary,
        success: designTokens.colors.success,
        warning: designTokens.colors.warning,
        danger: designTokens.colors.danger,
      }
    },
  },
  plugins: [
    require('tailwindcss-dir')(), 
  ],
};
export default config;
