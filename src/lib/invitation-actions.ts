"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase/server";

export async function acceptInvitation(id: string): Promise<{ error?: string }> {
  if (!z.string().uuid().safeParse(id).success) return { error: "Invitación inválida." };
  const supabase = await getSupabase();
  const { error } = await supabase.rpc("accept_club_invitation", { p_id: id });
  if (error) return { error: error.code === "P0001" ? error.message : "No se pudo aceptar la invitación." };
  revalidatePath("/", "layout"); return {};
}
