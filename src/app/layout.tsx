import type { Metadata, Viewport } from "next";
import AppNavigation from "@/components/app-navigation";
import PwaRegistrar from "@/components/pwa-registrar";
import { themeInitializationScript } from "@/lib/theme";
import { getSupabase } from "@/lib/supabase/server";
import "./globals.css";

export const metadata: Metadata = { title: "JUEGASANO", description: "Control de carga para fútbol", applicationName: "JUEGASANO", icons: { icon: "/icon-1024.png", apple: "/icon-1024.png" }, appleWebApp: { capable: true, title: "JUEGASANO", statusBarStyle: "default" } };
export const viewport: Viewport = { themeColor: "#176b4a" };
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const adminResult = user ? await supabase.rpc("is_platform_admin") : null;
  return <html lang="es-AR" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeInitializationScript }} /></head><body><PwaRegistrar /><AppNavigation isAdmin={adminResult?.data === true} /><main className="mx-auto max-w-5xl px-4 pb-24 pt-6 md:pb-8">{children}</main></body></html>;
}
