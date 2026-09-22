"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/club-context";
import { getAdminSupabase } from "@/lib/supabase/admin";

export type AdminActionState = { error?: string; success?: string };
function databaseMessage(error: { code?: string; message: string }, fallback: string) {
  return error.code === "P0001" ? error.message : error.code === "23505" ? "Ya existe un club con ese nombre." : fallback;
}
export async function createClub(_previous: AdminActionState, data: FormData): Promise<AdminActionState> {
  const { supabase } = await requirePlatformAdmin();
  const name = z.string().trim().min(1).max(150).safeParse(data.get("name"));
  if (!name.success) return { error: "Ingresá un nombre de club de hasta 150 caracteres." };
  const { error } = await supabase.rpc("admin_create_club", { p_name: name.data });
  if (error) return { error: databaseMessage(error, "No se pudo crear el club.") };
  revalidatePath("/admin");
  return { success: "Club creado. Ya podés seleccionarlo para invitar usuarios." };
}

export async function inviteClubUser(_previous: AdminActionState, data: FormData): Promise<AdminActionState> {
  const { supabase } = await requirePlatformAdmin();
  const parsed = z.object({ email: z.string().trim().email().max(254), club: z.string().uuid() }).safeParse({ email: data.get("email"), club: data.get("club") });
  if (!parsed.success) return { error: "Ingresá un correo válido y seleccioná un club." };
  let admin: ReturnType<typeof getAdminSupabase>;
  let origin: string;
  try {
    admin = getAdminSupabase();
    const site = new URL(process.env.APP_URL ?? "");
    if (site.protocol !== "https:" && !(site.protocol === "http:" && site.hostname === "localhost")) throw new Error();
    origin = site.origin;
  } catch { return { error: "Falta configurar APP_URL y la clave administrativa en el servidor." }; }
  const { data: invitation, error } = await supabase.rpc("admin_prepare_invitation", { p_club_id: parsed.data.club, p_email: parsed.data.email.toLowerCase() });
  if (error) return { error: databaseMessage(error, "No se pudo preparar la invitación.") };
  const redirectTo = `${origin}/auth/confirm?invitation=${invitation.id}`;
  let sent = false;
  try {
    const result = invitation.existingUser
      ? await admin.auth.signInWithOtp({ email: invitation.email, options: { shouldCreateUser: false, emailRedirectTo: redirectTo } })
      : await admin.auth.admin.inviteUserByEmail(invitation.email, { redirectTo });
    sent = !result.error;
  } catch { /* Preserve a recoverable invitation; never log email or credentials. */ }
  const { error: statusError } = await supabase.rpc("admin_mark_invitation_delivery", { p_id: invitation.id, p_sent: sent });
  revalidatePath("/admin");
  if (statusError) return { error: "No se pudo confirmar el estado del envío. Revisá la invitación antes de reenviarla." };
  return sent ? { success: "Correo de invitación solicitado. La membresía se habilita cuando el usuario acepta." } : { error: "El correo no pudo enviarse. La invitación quedó registrada para reintentar; todavía no se otorgó acceso al club." };
}

export async function revokeInvitation(_previous: AdminActionState, data: FormData): Promise<AdminActionState> {
  const { supabase } = await requirePlatformAdmin();
  const id = z.string().uuid().safeParse(data.get("id"));
  if (!id.success) return { error: "Invitación inválida." };
  const { error } = await supabase.rpc("admin_revoke_invitation", { p_id: id.data });
  if (error) return { error: "No se pudo revocar la invitación." };
  revalidatePath("/admin"); return { success: "Invitación revocada." };
}
