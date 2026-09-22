"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) { document.documentElement.dataset.theme = theme; document.documentElement.style.colorScheme = theme; }

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  useEffect(() => {
    const syncTheme = () => setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
    const timer = window.setTimeout(syncTheme, 0);
    window.addEventListener("theme-change", syncTheme);
    return () => { window.clearTimeout(timer); window.removeEventListener("theme-change", syncTheme); };
  }, []);
  function toggle() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(next);
    try { localStorage.setItem("theme", next); } catch { /* Keep the toggle working when storage is unavailable. */ }
    window.dispatchEvent(new Event("theme-change"));
  }
  return <button className="theme-toggle" type="button" onClick={toggle} aria-label={theme === "light" ? "Activar modo oscuro" : "Activar modo claro"} title={theme === "light" ? "Modo oscuro" : "Modo claro"}>{theme === "light" ? "🌙" : "☀️"}</button>;
}
