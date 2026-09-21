"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) { document.documentElement.dataset.theme = theme; document.documentElement.style.colorScheme = theme; }

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  useEffect(() => { const saved = localStorage.getItem("theme") as Theme | null; const next = saved ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"); applyTheme(next); const timer = window.setTimeout(() => setTheme(next), 0); return () => window.clearTimeout(timer); }, []);
  function toggle() { const next = theme === "light" ? "dark" : "light"; setTheme(next); localStorage.setItem("theme", next); applyTheme(next); }
  return <button className="theme-toggle" type="button" onClick={toggle} aria-label={theme === "light" ? "Activar modo oscuro" : "Activar modo claro"} title={theme === "light" ? "Modo oscuro" : "Modo claro"}>{theme === "light" ? "🌙" : "☀️"}</button>;
}
