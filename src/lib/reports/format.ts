import type { DashboardRow } from "../../types/domain";

export type ReportMetadata = { club: string; period: string; competition: string; player: string; generatedAt: string };
export const RECENT_LEGEND = "Frecuencia reciente: ventana actual de los últimos 14 días, independiente del período y la competencia seleccionados. Referencias: 3 partidos, 4 partidos, 5 o más partidos.";
export function borgText(value: number | null) { return value === null ? "Sin registros" : value.toFixed(1); }
export function reportText(meta: ReportMetadata, rows: DashboardRow[]) {
  return ["JUEGASANO", `Club: ${meta.club}`, meta.period, `Competencia: ${meta.competition}`, `Jugador: ${meta.player}`, `Generado: ${meta.generatedAt}`, "Plantel activo", "", ...rows.map(row => `${row.name} (${row.position}) — ${row.minutes} minutos; ${row.matches} partidos; Borg promedio: ${borgText(row.averageBorg)}; frecuencia reciente: ${row.recentMatches} partidos.`), ...(rows.length ? [] : ["No hay jugadores para los filtros seleccionados"]), "", RECENT_LEGEND].join("\n");
}
