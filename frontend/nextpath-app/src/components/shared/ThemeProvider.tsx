"use client";

import * as React from "react";
import { useAppStore } from "@/store/useAppStore";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppStore((s) => s.theme);
  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);
  return <>{children}</>;
}
