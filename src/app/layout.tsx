import type { Metadata, Viewport } from "next";
import Link from "next/link";
import PwaRegistrar from "@/components/pwa-registrar";
import ThemeToggle from "@/components/theme-toggle";
import "./globals.css";

export const metadata: Metadata = { title: "Control de Carga de Jugadores", description: "Registro de minutos y Borg para fútbol", applicationName: "Control de Carga de Jugadores", icons: { icon: "/icon-1024.png", apple: "/icon-1024.png" }, appleWebApp: { capable: true, title: "Carga Jugadores", statusBarStyle: "default" } };
export const viewport: Viewport = { themeColor: "#176b4a" };
const items = [["/dashboard", "Control de carga"], ["/players", "Jugadores"], ["/matches", "Partidos"], ["/competitions", "Competencias"]] as const;
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body><PwaRegistrar /><main className="mx-auto max-w-5xl px-4 pb-24 pt-6 md:pb-8">{children}</main><nav className="mobile-nav fixed bottom-0 left-0 right-0 flex items-center justify-around border-t border-slate-200 bg-white px-2 py-3">{items.map(([href, label]) => <Link className="nav-link" href={href} key={href}>{label}</Link>)}<ThemeToggle /></nav></body></html>;
}
