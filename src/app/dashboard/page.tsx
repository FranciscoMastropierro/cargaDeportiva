import Link from "next/link";
import MobileReportList from "@/components/mobile-report-list";
import { getCompetitions, getDashboard, getPlayers } from "@/lib/data";

import { parseDashboardFilters, dashboardQuery, dashboardTitle } from "@/lib/validations/dashboard";
export const dynamic = "force-dynamic";
const PAGE_SIZE = 10;

function frequencyClass(matches: number) { return matches >= 5 ? "text-red-700" : matches === 4 ? "text-orange-700" : matches === 3 ? "text-amber-700" : ""; }

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ period?: "month" | "year" | "total"; date?: string; competition?: string; player?: string; page?: string }> }) {
  const params = await searchParams;
  const filters = parseDashboardFilters(params);
  if (!filters) return <section><h1 className="text-2xl font-bold">Informes</h1><p role="alert">Filtro inválido. Revisá el período y la fecha.</p><Link href="/dashboard">Restablecer filtros</Link></section>;
  const { period, date } = filters;

  const page = (/^\d+$/.test(params.page ?? "1") ? Math.max(1, Number(params.page ?? 1)) : 1);
  const [competitions, players, rows] = await Promise.all([getCompetitions(false), getPlayers(false), getDashboard(period, date, params.competition, params.player)]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const visible = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const query = dashboardQuery(filters);

  return <section className="space-y-5"><header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Informes</h1><p className="text-sm text-slate-600">{dashboardTitle(filters)}</p></div><Link className="button" href={`/dashboard/report?${query.toString()}`}>Generar informe</Link></header>
    <form noValidate className="card grid gap-3 sm:grid-cols-4"><label className="grid gap-1 text-sm font-medium">Período<select name="period" defaultValue={period}><option value="month">Mensual</option><option value="year">Anual</option><option value="total">Total</option></select></label><label className="grid gap-1 text-sm font-medium">Fecha<input type={period === "year" ? "number" : "month"} name="date" defaultValue={period === "year" ? date.slice(0, 4) : date} disabled={period === "total"} /></label><label className="grid gap-1 text-sm font-medium">Competencia<select name="competition" defaultValue={params.competition ?? ""}><option value="">Todas</option>{competitions.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label className="grid gap-1 text-sm font-medium">Jugador<select name="player" defaultValue={params.player ?? ""}><option value="">Todos</option>{players.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><button className="button sm:col-span-4" type="submit">Aplicar filtros</button></form>
    <p className="text-xs text-slate-600">Frecuencia últimos 14 días: amarillo (3), naranja (4), rojo (5 o más partidos).</p>
    <MobileReportList rows={rows} />
    <div className="card hidden overflow-x-auto md:block"><table className="w-full text-left text-sm"><caption className="mb-3 text-left font-bold">Minutos y Borg por jugador</caption><thead className="border-b text-slate-600"><tr><th className="p-2">Jugador</th><th className="p-2">Posición</th><th className="p-2 text-right">Minutos</th><th className="p-2 text-right">Partidos</th><th className="p-2 text-right">Borg promedio</th></tr></thead><tbody>{visible.map((row) => <tr className="border-b last:border-0" key={row.id}><td className={`p-2 font-bold ${frequencyClass(row.recentMatches)}`}>{row.name}</td><td className="p-2">{row.position}</td><td className="p-2 text-right">{row.minutes}</td><td className="p-2 text-right">{row.matches}</td><td className="p-2 text-right">{row.averageBorg?.toFixed(1) ?? "—"}</td></tr>)}</tbody></table>{pages > 1 && <div className="mt-4 flex items-center justify-end gap-3"><Link className="button button-secondary" aria-disabled={safePage === 1} href={`/dashboard?${query.toString()}&page=${Math.max(1, safePage - 1)}`}>Anterior</Link><span>Página {safePage} de {pages}</span><Link className="button button-secondary" aria-disabled={safePage === pages} href={`/dashboard?${query.toString()}&page=${Math.min(pages, safePage + 1)}`}>Siguiente</Link></div>}</div>
  </section>;
}
