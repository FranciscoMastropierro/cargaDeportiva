export type PhysicalStatus = "available" | "minor_issue" | "injured";
export const FOOTBALL_POSITIONS = ["Arquero", "Defensor central", "Defensor lateral", "Mediocampista", "Volante", "Enganche", "Delantero"] as const;
export type Player = { id: string; name: string; position: string; active: boolean; physical_status: PhysicalStatus };
export type Competition = { id: string; name: string; active: boolean };
export type Match = { id: string; competition_id: string; match_date: string; opponent: string; competitions?: { name: string } | null };
export type PlayerMatchStat = { player_id: string; match_id: string; minutes_played: number; borg: number };
export type DashboardRow = Player & { minutes: number; matches: number; averageBorg: number | null; recentMatches: number };
