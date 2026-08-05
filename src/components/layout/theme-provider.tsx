"use client";
import * as React from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "financeflow:theme";

/**
 * localStorage can throw (private browsing, blocked storage, some embedded
 * contexts). Every call is wrapped so a throw can never propagate out of
 * this component.
 */
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Non-fatal — theme just won't persist across sessions in this browser.
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("light");
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">("light");

  // Single effect instead of two separate ones — reads the stored theme
  // once on mount, then applies it (and reacts to OS dark-mode changes if
  // the theme is "system"). Every setState call below is guarded so it
  // only fires when the value is actually different, which makes this
  // provably safe against "Maximum update depth exceeded": React bails out
  // of re-rendering when setState is called with the same value it already
  // has, so even in the worst case this can never cascade into a loop.
  React.useEffect(() => {
    const stored = safeGetItem(STORAGE_KEY) as Theme | null;
    if (stored && stored !== theme) {
      setThemeState(stored);
      // The effect below (matchMedia listener) re-runs automatically once
      // `theme` actually changes, since it depends on `theme` — no need to
      // duplicate the resolve logic here.
    }
    // Intentionally runs once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      const resolved: "light" | "dark" = theme === "system" ? (mql.matches ? "dark" : "light") : theme;
      setResolvedTheme((prev) => (prev === resolved ? prev : resolved));
      document.documentElement.classList.toggle("dark", resolved === "dark");
    };

    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, [theme]);

  const setTheme = React.useCallback((t: Theme) => {
    setThemeState((prev) => (prev === t ? prev : t));
    safeSetItem(STORAGE_KEY, t);
  }, []);

  const value = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
