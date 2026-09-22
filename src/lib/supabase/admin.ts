import "server-only";
import { createClient } from "@supabase/supabase-js";

// Call only after requirePlatformAdmin. Never return this client to the browser.
export function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Falta configurar el envío de invitaciones en el servidor.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
