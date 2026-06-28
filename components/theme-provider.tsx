"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const Ctx = createContext<ThemeCtx>({ theme: "system", setTheme: () => {} });

function applyClass(theme: Theme) {
  const sysDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark  = theme === "dark" || (theme === "system" && sysDark);
  document.documentElement.classList.toggle("dark", isDark);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");

  useEffect(() => {
    const stored = (localStorage.getItem("lv-theme") as Theme | null) ?? "system";
    setThemeState(stored);
    applyClass(stored);

    const mq      = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const t = (localStorage.getItem("lv-theme") as Theme | null) ?? "system";
      if (t === "system") applyClass("system");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  function setTheme(next: Theme) {
    setThemeState(next);
    localStorage.setItem("lv-theme", next);
    applyClass(next);
  }

  return <Ctx.Provider value={{ theme, setTheme }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  return useContext(Ctx);
}
