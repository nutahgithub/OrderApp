import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type ThemeName = "fresh" | "classic" | "high-contrast";

type ThemeContextValue = {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
};

const storageKey = "orderapp.theme";
const themes: ThemeName[] = ["fresh", "classic", "high-contrast"];
const defaultTheme: ThemeName = "fresh";

const isThemeName = (value: string | null): value is ThemeName => {
  return Boolean(value && themes.includes(value as ThemeName));
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    if (typeof window === "undefined") {
      return defaultTheme;
    }

    const storedTheme = window.localStorage.getItem(storageKey);

    return isThemeName(storedTheme) ? storedTheme : defaultTheme;
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(storageKey, theme);
  }, [theme]);

  const setTheme = useCallback((nextTheme: ThemeName) => {
    setThemeState(nextTheme);
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({ theme, setTheme }), [setTheme, theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
};

export const themeOptions: ThemeName[] = themes;
