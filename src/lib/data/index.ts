import { getSupabase } from "@/lib/supabase/server";
import type { Competition, DashboardRow, Match, Player, PlayerMatchStat } from "@/types/domain";

export async function getPlayers(includeInactive = true) {
  const supabase = await getSupabase(); let query = supabase.from("players").select("id,name,position,active,physical_status").order("name");
  if (!includeInactive) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Player[];
}

export async function getCompetitions(includeInactive = true) {
  const supabase = await getSupabase(); let query = supabase.from("competitions").select("id,name,active").order("name");
  if (!includeInactive) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Competition[];
}

export async function getMatches() {
  const supabase = await getSupabase(); const { data, error } = await supabase
    .from("matches")
    .select("id,competition_id,match_date,opponent,competitions(name)")
    .order("match_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Match[];
}

export async function getMatch(id: string) {
  const supabase = await getSupabase(); const { data, error } = await supabase
    .from("matches")
    .select("id,competition_id,match_date,opponent,competitions(name)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as unknown as Match;
}

export async function getMatchStats(matchId: string) {
  const supabase = await getSupabase(); const { data, error } = await supabase
    .from("player_match_stats")
    .select("player_id,match_id,minutes_played,borg")
    .eq("match_id", matchId);
  if (error) throw error;
  return (data ?? []) as PlayerMatchStat[];
}

export async function getDashboard(period: "month" | "year" | "total", date: string, competitionId?: string, playerId?: string) {
  const [year, calendarMonth] = date.split("-").map(Number);
  const start = period === "month" ? `${date}-01` : period === "year" ? `${year}-01-01` : undefined;
  const end = period === "month" ? new Date(Date.UTC(year, calendarMonth, 1)).toISOString().slice(0, 10) : period === "year" ? `${year + 1}-01-01` : undefined;
  const players = await getPlayers(false);
  const supabase = await getSupabase();
  let query = supabase
    .from("player_match_stats")
    .select("player_id,minutes_played,borg,matches!inner(match_date,competition_id)");
  if (start && end) query = query.gte("matches.match_date", start).lt("matches.match_date", end);
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
  const recentStart = new Date(); recentStart.setDate(recentStart.getDate() - 14);
  const { data: recentData, error: recentError } = await supabase.from("player_match_stats").select("player_id,matches!inner(match_date)").gte("matches.match_date", recentStart.toISOString().slice(0, 10));
  if (recentError) throw recentError;
  const recentCounts = new Map<string, number>(); for (const stat of recentData ?? []) recentCounts.set(stat.player_id, (recentCounts.get(stat.player_id) ?? 0) + 1);
  return players
    .filter((player) => !playerId || player.id === playerId)
    .map<DashboardRow>((player) => {
      const row = results.get(player.id);
      return { ...player, minutes: row?.minutes ?? 0, matches: row?.matches ?? 0, averageBorg: row ? row.borgTotal / row.matches : null, recentMatches: recentCounts.get(player.id) ?? 0 };
    })
    .sort((a, b) => b.minutes - a.minutes || a.name.localeCompare(b.name));
}
