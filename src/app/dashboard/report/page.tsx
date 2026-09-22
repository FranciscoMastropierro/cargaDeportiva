import Link from "next/link";
import { redirect } from "next/navigation";
import ReportActions from "@/components/report-actions";
import { getCompetitions, getDashboard, getPlayers } from "@/lib/data";
import { getSupabase } from "@/lib/supabase/server";
import { dashboardQuery, dashboardTitle, parseDashboardFilters } from "@/lib/validations/dashboard";
import { borgText, RECENT_LEGEND, reportText } from "@/lib/reports/format";

export const dynamic = "force-dynamic";

export default async function ReportPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = parseDashboardFilters(await searchParams);
  if (!filters) return <section><h1>Informes</h1><p role="alert">Filtro inválido. Revisá el período y la fecha.</p><Link href="/dashboard">Restablecer filtros</Link></section>;
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile, error: profileError } = await supabase.from("profiles").select("club_id").eq("id", user.id).maybeSingle();
  if (profileError) throw profileError;
  if (!profile) return <p role="alert">Tu cuenta aún no está vinculada a un club.</p>;
  const { data: club, error: clubError } = await supabase.from("clubs").select("name").eq("id", profile.club_id).single();
  if (clubError) throw clubError;
  const [competitions, players, rows] = await Promise.all([getCompetitions(), getPlayers(), getDashboard(filters.period, filters.date, filters.competition, filters.player)]);
  const competition = filters.competition ? competitions.find(item => item.id === filters.competition)?.name : "Todas";
  const player = filters.player ? players.find(item => item.id === filters.player)?.name : "Todos";
  if (!competition || !player) return <section><p role="alert">Filtro inválido. La competencia o el jugador no están disponibles.</p><Link href="/dashboard">Restablecer filtros</Link></section>;
  const meta = { club: club.name, period: dashboardTitle(filters), competition, player, generatedAt: new Intl.DateTimeFormat("es-AR", { dateStyle: "long", timeStyle: "short", timeZone: "America/Argentina/Buenos_Aires" }).format(new Date()) + " (Argentina)" };
  return <article className="report space-y-5">
    <Link className="button button-secondary" href={`/dashboard?${dashboardQuery(filters)}`}>Volver a Informes</Link>
    <header><h1 className="text-2xl font-bold">JUEGASANO</h1><h2 className="text-xl">{meta.period}</h2><p>Club: {meta.club}</p><p>Competencia: {meta.competition}</p><p>Jugador: {meta.player}</p><p>Generado: {meta.generatedAt}</p><p className="font-bold">Plantel activo</p></header>
    <ReportActions text={reportText(meta, rows)} />
    {rows.length ? <div className="report-table-wrap"><table className="report-table"><caption>Métricas del período y frecuencia reciente</caption><thead><tr>{["Jugador", "Posición", "Minutos", "Partidos", "Borg promedio", "Frecuencia reciente (partidos)"].map(title => <th key={title}>{title}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.id}><td>{row.name}</td><td>{row.position}</td><td>{row.minutes}</td><td>{row.matches}</td><td>{borgText(row.averageBorg)}</td><td>{row.recentMatches}</td></tr>)}</tbody></table></div> : <p>No hay jugadores para los filtros seleccionados</p>}
    <p className="text-sm">{RECENT_LEGEND}</p>
  </article>;
}
