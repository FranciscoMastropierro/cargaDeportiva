import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/manifest.webmanifest" || pathname === "/sw.js" || pathname === "/icon.svg" || pathname === "/icon-1024.png") {
    return NextResponse.next();
  }
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => { items.forEach(({ name, value }) => request.cookies.set(name, value)); response = NextResponse.next({ request }); items.forEach(({ name, value, options }) => response.cookies.set(name, value, options)); },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  function redirectWithSession(path: string) {
    const redirect = NextResponse.redirect(new URL(path, request.url));
    response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie));
    return redirect;
  }
  const isPublic = ["/login", "/forgot-password", "/auth/callback", "/auth/confirm"].includes(request.nextUrl.pathname);
  if (!user && !isPublic) return redirectWithSession("/login");
  if (user && request.nextUrl.pathname === "/login") return redirectWithSession("/dashboard");
  if (user && ["/dashboard", "/players", "/matches", "/competitions"].some(route => pathname === route || pathname.startsWith(`${route}/`))) {
    const { data: profile, error } = await supabase.from("profiles").select("club_id").eq("id", user.id).maybeSingle();
    if (error || !profile) return redirectWithSession("/account/unlinked");
  }
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
