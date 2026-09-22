import { getSupabase } from "@/lib/supabase/server";

export async function requireClub() {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sesión requerida.");
  const { data: profile, error } = await supabase.from("profiles").select("club_id").eq("id", user.id).maybeSingle();
  if (error || !profile) throw new Error("La cuenta no está asociada a un club.");
  return { supabase, user, clubId: profile.club_id as string };
}

export async function requirePlatformAdmin() {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sesión requerida.");
  const { data, error } = await supabase.rpc("is_platform_admin");
  if (error || data !== true) throw new Error("Acceso no autorizado.");
  return { supabase, user };
}
