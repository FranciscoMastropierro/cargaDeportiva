"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireClub } from "@/lib/club-context";
import { FOOTBALL_POSITIONS } from "@/types/domain";
import type { ImportSnapshot } from "@/lib/imports/players";

const importSchema = z.object({ operationId: z.string().uuid(), revision: z.string().regex(/^[a-f0-9]{32}$/), rows: z.array(z.object({ name: z.string().trim().min(1), position: z.enum(FOOTBALL_POSITIONS), allowDuplicate: z.boolean() })).min(1).max(50) });

export async function refreshImportSnapshot(): Promise<{ snapshot?: ImportSnapshot; error?: string }> {
  const { supabase } = await requireClub();
  const { data, error } = await supabase.rpc("player_import_snapshot");
  return error ? { error: "No se pudo consultar el plantel. Verificá la sesión y la configuración de importación." } : { snapshot: data as ImportSnapshot };
}

export async function importPlayers(input: unknown): Promise<{ count?: number; error?: string }> {
  const parsed = importSchema.safeParse(input);
  if (!parsed.success || JSON.stringify(parsed.data).length > 1048576) return { error: "Revisá los jugadores seleccionados y sus posiciones." };
  const { supabase } = await requireClub();
  const { operationId, revision, rows } = parsed.data;
  const { data, error } = await supabase.rpc("import_players", { p_operation_id: operationId, p_revision: revision, p_rows: rows });
  if (error) return { error: error.code === "P0001" ? error.message : "No se pudo importar el lote. Ningún jugador se agregó parcialmente; podés reintentar." };
  revalidatePath("/players"); revalidatePath("/dashboard");
  return { count: data as number };
}

export async function deletePlayer(formData: FormData): Promise<{ error?: string; success?: string }> {
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success || formData.get("confirmed") !== "true") return { error: "Confirmá la eliminación del jugador y su historial." };
  const { supabase } = await requireClub();
  const { data, error } = await supabase.rpc("delete_player_with_history", { p_player_id: id.data, p_confirm: true });
  if (error) return { error: error.code === "P0001" ? error.message : "No se pudo eliminar. El jugador y su historial se conservaron." };
  revalidatePath("/players"); revalidatePath("/dashboard"); revalidatePath("/matches", "layout");
  return { success: `Jugador eliminado junto con ${data} registros de participación.` };
}
