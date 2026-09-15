export type Player = { id: string; name: string; position: string; active: boolean };
export type Competition = { id: string; name: string; active: boolean };
export type Match = {
  id: string;
  competition_id: string;
  match_date: string;
  opponent: string;
  competitions?: { name: string } | null;
};
export type PlayerMatchStat = {
  player_id: string;
  match_id: string;
  minutes_played: number;
  borg: number;
};
export type DashboardRow = Player & {
  minutes: number;
  matches: number;
  averageBorg: number | null;
};
