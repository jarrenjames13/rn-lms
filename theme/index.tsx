import { useColorScheme } from "nativewind";
import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export const lightTheme = {
  canvas: "#F7F7FA", surface: "#FFFFFF", surfaceMuted: "#F2ECF8", surfaceAccent: "#FCECEF",
  text: "#201D25", textMuted: "#6C6572", border: "#E6E1E8", primary: "#6842A0",
  primaryPressed: "#52347E", school: "#B42335", success: "#167A50", warning: "#A75D00",
  danger: "#B42335", tabInactive: "#817987",
};
export type Theme = typeof lightTheme;
export type AppearanceMode = "light" | "dark" | "system";
export const darkTheme: Theme = {
  canvas: "#111014", surface: "#1A181E", surfaceMuted: "#2A2038", surfaceAccent: "#3A2025",
  text: "#F7F4FA", textMuted: "#BEB6C5", border: "#37313C", primary: "#A98ADC",
  primaryPressed: "#C4A9E9", school: "#F06A78", success: "#58C99A", warning: "#F2B35C",
  danger: "#F06A78", tabInactive: "#BEB6C5",
};

type ThemeContextValue = {
  theme: Theme;
  isDark: boolean;
  appearanceMode: AppearanceMode;
  setAppearanceMode: (mode: AppearanceMode) => void;
};
const ThemeContext = createContext<ThemeContextValue | null>(null);
const APPEARANCE_MODE_KEY = "appearance_mode";

const isAppearanceMode = (value: string | null): value is AppearanceMode =>
  value === "light" || value === "dark" || value === "system";

export function AppThemeProvider({ children }: React.PropsWithChildren) {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [appearanceMode, setAppearanceModeState] = useState<AppearanceMode>("system");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    void SecureStore.getItemAsync(APPEARANCE_MODE_KEY)
      .then((savedMode) => {
        if (!mounted || !isAppearanceMode(savedMode)) return;
        setAppearanceModeState(savedMode);
        setColorScheme(savedMode);
      })
      .catch((error) => {
        if (__DEV__) console.warn("Unable to restore appearance mode", error);
      })
      .finally(() => {
        if (mounted) setIsReady(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const setAppearanceMode = (mode: AppearanceMode) => {
    setAppearanceModeState(mode);
    setColorScheme(mode);
    void SecureStore.setItemAsync(APPEARANCE_MODE_KEY, mode);
  };

  const value = useMemo(
    () => ({
      theme: colorScheme === "dark" ? darkTheme : lightTheme,
      isDark: colorScheme === "dark",
      appearanceMode,
      setAppearanceMode,
    }),
    [appearanceMode, colorScheme],
  );

  return <ThemeContext.Provider value={value}>{isReady ? children : null}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useAppTheme must be used within AppThemeProvider");
  return context;
}
