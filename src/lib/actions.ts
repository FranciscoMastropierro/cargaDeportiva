"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabase } from "@/lib/supabase/server";
import { competitionSchema, matchSchema, playerSchema, statSchema } from "@/lib/validations/forms";

function value(formData: FormData, key: string) { return String(formData.get(key) ?? ""); }

export async function savePlayer(formData: FormData) {
  const input = playerSchema.parse({ name: value(formData, "name"), position: value(formData, "position") });
  const id = value(formData, "id"); const supabase = getSupabase();
  const result = id ? await supabase.from("players").update(input).eq("id", id) : await supabase.from("players").insert(input);
  if (result.error) throw result.error; revalidatePath("/players"); redirect("/players");
}
export async function togglePlayer(formData: FormData) {
  const id = value(formData, "id"), active = value(formData, "active") === "true";
  const { error } = await getSupabase().from("players").update({ active: !active }).eq("id", id);
  if (error) throw error; revalidatePath("/players");
}
export async function saveCompetition(formData: FormData) {
  const input = competitionSchema.parse({ name: value(formData, "name") }); const id = value(formData, "id"); const supabase = getSupabase();
  const result = id ? await supabase.from("competitions").update(input).eq("id", id) : await supabase.from("competitions").insert(input);
  if (result.error) throw result.error; revalidatePath("/competitions"); redirect("/competitions");
}
export async function toggleCompetition(formData: FormData) {
  const id = value(formData, "id"), active = value(formData, "active") === "true";
  const { error } = await getSupabase().from("competitions").update({ active: !active }).eq("id", id);
  if (error) throw error; revalidatePath("/competitions");
}
export async function saveMatch(formData: FormData) {
  const input = matchSchema.parse({ competitionId: value(formData, "competitionId"), matchDate: value(formData, "matchDate"), opponent: value(formData, "opponent") });
  const id = value(formData, "id"); const record = { competition_id: input.competitionId, match_date: input.matchDate, opponent: input.opponent }; const supabase = getSupabase();
  const result = id ? await supabase.from("matches").update(record).eq("id", id) : await supabase.from("matches").insert(record).select("id").single();
  if (result.error) throw result.error;
  revalidatePath("/matches");
  if (id) redirect(`/matches/${id}`);
  if (!result.data) throw new Error("No se pudo crear el partido.");
  redirect(`/matches/${result.data.id}`);
}
export async function saveMatchStats(formData: FormData) {
  const matchId = value(formData, "matchId");
  const entries = Array.from(formData.getAll("playerId")).flatMap((entry) => { const playerId = String(entry), minutes = value(formData, `minutes-${playerId}`), borg = value(formData, `borg-${playerId}`); if (!minutes && !borg) return []; return [statSchema.parse({ playerId, minutesPlayed: Number(minutes), borg: Number(borg) })]; });
  const { error } = await getSupabase().rpc("replace_match_stats", { p_match_id: matchId, p_stats: entries.map((entry) => ({ player_id: entry.playerId, minutes_played: entry.minutesPlayed, borg: entry.borg })) });
  if (error) throw error; revalidatePath(`/matches/${matchId}`); revalidatePath("/dashboard");
}
