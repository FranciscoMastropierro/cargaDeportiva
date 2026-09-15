import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = { title: "Carga Deportiva", description: "Registro de minutos y Borg" };
const items = [["/dashboard", "Dashboard"], ["/players", "Jugadores"], ["/matches", "Partidos"], ["/competitions", "Competencias"]] as const;
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body><main className="mx-auto max-w-5xl px-4 pb-24 pt-6 md:pb-8">{children}</main><nav className="mobile-nav fixed bottom-0 left-0 right-0 flex justify-around border-t border-slate-200 bg-white px-2 py-3">{items.map(([href, label]) => <Link className="nav-link" href={href} key={href}>{label}</Link>)}</nav></body></html>;
}
