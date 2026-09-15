import { getSupabase } from "@/lib/supabase/server";
import type { Competition, DashboardRow, Match, Player, PlayerMatchStat } from "@/types/domain";

export async function getPlayers(includeInactive = true) {
  let query = getSupabase().from("players").select("id,name,position,active").order("name");
  if (!includeInactive) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Player[];
}

export async function getCompetitions(includeInactive = true) {
  let query = getSupabase().from("competitions").select("id,name,active").order("name");
  if (!includeInactive) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Competition[];
}

export async function getMatches() {
  const { data, error } = await getSupabase()
    .from("matches")
    .select("id,competition_id,match_date,opponent,competitions(name)")
    .order("match_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Match[];
}

export async function getMatch(id: string) {
  const { data, error } = await getSupabase()
    .from("matches")
    .select("id,competition_id,match_date,opponent,competitions(name)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as unknown as Match;
}

export async function getMatchStats(matchId: string) {
  const { data, error } = await getSupabase()
    .from("player_match_stats")
    .select("player_id,match_id,minutes_played,borg")
    .eq("match_id", matchId);
  if (error) throw error;
  return (data ?? []) as PlayerMatchStat[];
}

export async function getDashboard(month: string, competitionId?: string, playerId?: string) {
  const [year, calendarMonth] = month.split("-").map(Number);
  const start = `${month}-01`;
  const end = new Date(Date.UTC(year, calendarMonth, 1)).toISOString().slice(0, 10);
  const players = await getPlayers(false);
  const supabase = getSupabase();
  let query = supabase
    .from("player_match_stats")
    .select("player_id,minutes_played,borg,matches!inner(match_date,competition_id)")
    .gte("matches.match_date", start)
    .lt("matches.match_date", end);
  if (competitionId) query = query.eq("matches.competition_id", competitionId);
  if (playerId) query = query.eq("player_id", playerId);
  const { data, error } = await query;
  if (error) throw error;
  const results = new Map<string, { minutes: number; matches: number; borgTotal: number }>();
  for (const stat of data ?? []) {
    const current = results.get(stat.player_id) ?? { minutes: 0, matches: 0, borgTotal: 0 };
    current.minutes += stat.minutes_played;
    current.matches += 1;
    current.borgTotal += stat.borg;
    results.set(stat.player_id, current);
  }
  return players
    .filter((player) => !playerId || player.id === playerId)
    .map<DashboardRow>((player) => {
      const row = results.get(player.id);
      return { ...player, minutes: row?.minutes ?? 0, matches: row?.matches ?? 0, averageBorg: row ? row.borgTotal / row.matches : null };
    })
    .sort((a, b) => b.minutes - a.minutes || a.name.localeCompare(b.name));
}
