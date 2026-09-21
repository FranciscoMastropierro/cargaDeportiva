"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/actions";
import ThemeToggle from "@/components/theme-toggle";

const items = [["/dashboard", "Informes"], ["/players", "Jugadores"], ["/matches", "Partidos"], ["/competitions", "Competencias"]] as const;
const authRoutes = new Set(["/login", "/forgot-password", "/reset-password"]);

function Links() {
  const pathname = usePathname();
  return <>{items.map(([href, label]) => <Link className={`nav-link ${pathname === href ? "nav-link-active" : ""}`} href={href} key={href}>{label}</Link>)}</>;
}

function Actions({ mobile = false }: { mobile?: boolean }) {
  return <>
    <Link className={mobile ? "theme-toggle action-icon" : "button"} href="/matches" aria-label="Crear nuevo partido" title="Crear nuevo partido">{mobile ? "＋" : "Nuevo partido"}</Link>
    <ThemeToggle />
    <form action={signOut} noValidate>
      <button className={mobile ? "theme-toggle action-icon" : "button button-secondary"} type="submit" aria-label="Cerrar sesión" title="Cerrar sesión">{mobile ? "↪" : "Cerrar sesión"}</button>
    </form>
  </>;
}

export default function AppNavigation() {
  const pathname = usePathname();
  if (authRoutes.has(pathname)) return null;
  return <>
    <header className="desktop-nav hidden md:flex"><Link className="brand" href="/dashboard">JUEGASANO</Link><nav className="flex items-center gap-5"><Links /></nav><div className="ml-auto flex items-center gap-2"><Actions /></div></header>
    <nav className="mobile-nav fixed bottom-0 left-0 right-0 flex items-center justify-around border-t px-2 py-3 md:hidden"><Links /><details className="relative"><summary className="theme-toggle list-none" aria-label="Abrir acciones">⋯</summary><div className="mobile-actions absolute bottom-11 right-0 z-10 grid gap-2 rounded-xl p-3 shadow-lg"><Actions mobile /></div></details></nav>
  </>;
}
