export type DashboardFilters = { period: "month" | "year" | "total"; date: string; competition?: string; player?: string };
type Params = Record<string, string | string[] | undefined>;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseDashboardFilters(params: Params, now = new Date()): DashboardFilters | null {
  const period = params.period ?? "total";
  const date = params.date ?? now.toISOString().slice(0, 7);
  if (period !== "month" && period !== "year" && period !== "total") return null;
  if (typeof date !== "string" || !/^\d{4}(-(?:0[1-9]|1[0-2]))?$/.test(date) || Number(date.slice(0, 4)) === 0) return null;
  if (period === "month" && date.length !== 7) return null;
  for (const id of [params.competition, params.player]) if (id && (typeof id !== "string" || !uuid.test(id))) return null;
  return { period, date: period === "year" ? date.slice(0, 4) : date, competition: params.competition as string | undefined, player: params.player as string | undefined };
}

export function dashboardDateRange({ period, date }: DashboardFilters) {
  if (period === "total") return null;
  const year = date.slice(0, 4);
  if (period === "year") return { start: `${year}-01-01`, end: `${year}-12-31` };
  const y = Number(year), month = Number(date.slice(5));
  const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
  return { start: `${date}-01`, end: `${date}-${days}` };
}

export function dashboardQuery(filters: DashboardFilters) {
  return new URLSearchParams({ period: filters.period, date: filters.date, ...(filters.competition ? { competition: filters.competition } : {}), ...(filters.player ? { player: filters.player } : {}) });
}

export function dashboardTitle({ period, date }: DashboardFilters) {
  if (period === "total") return "Carga histórica";
  if (period === "year") return `Carga de ${date.slice(0, 4)}`;
  const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  return `Carga ${months[Number(date.slice(5)) - 1]} de ${date.slice(0, 4)}`;
}
