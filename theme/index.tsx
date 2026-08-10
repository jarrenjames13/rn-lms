import { useColorScheme } from "nativewind";
import React, { createContext, useContext, useMemo } from "react";

export const lightTheme = {
  canvas: "#F7F7FA", surface: "#FFFFFF", surfaceMuted: "#F2ECF8", surfaceAccent: "#FCECEF",
  text: "#201D25", textMuted: "#6C6572", border: "#E6E1E8", primary: "#6842A0",
  primaryPressed: "#52347E", school: "#B42335", success: "#167A50", warning: "#A75D00",
  danger: "#B42335", tabInactive: "#817987",
};
export type Theme = typeof lightTheme;
export const darkTheme: Theme = {
  canvas: "#111014", surface: "#1A181E", surfaceMuted: "#2A2038", surfaceAccent: "#3A2025",
  text: "#F7F4FA", textMuted: "#BEB6C5", border: "#37313C", primary: "#A98ADC",
  primaryPressed: "#C4A9E9", school: "#F06A78", success: "#58C99A", warning: "#F2B35C",
  danger: "#F06A78", tabInactive: "#BEB6C5",
};

type ThemeContextValue = { theme: Theme; isDark: boolean; setColorScheme: (scheme: "light" | "dark" | "system") => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function AppThemeProvider({ children }: React.PropsWithChildren) {
  const { colorScheme, setColorScheme } = useColorScheme();
  const value = useMemo(() => ({ theme: colorScheme === "dark" ? darkTheme : lightTheme, isDark: colorScheme === "dark", setColorScheme }), [colorScheme, setColorScheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useAppTheme must be used within AppThemeProvider");
  return context;
}
