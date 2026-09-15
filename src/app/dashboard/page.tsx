import Link from "next/link";
import { getCompetitions, getDashboard, getPlayers } from "@/lib/data";

export const dynamic = "force-dynamic";

function currentMonth() { return new Date().toISOString().slice(0, 7); }

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ month?: string; competition?: string; player?: string }> }) {
  const params = await searchParams; const month = params.month ?? currentMonth();
  const [competitions, players, rows] = await Promise.all([getCompetitions(false), getPlayers(false), getDashboard(month, params.competition, params.player)]);
  const label = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(new Date(`${month}-01T12:00:00`));
  return <section className="space-y-5"><header className="flex items-start justify-between gap-4"><div><h1 className="text-2xl font-bold">Dashboard</h1><p className="capitalize text-sm text-slate-600">Resumen de {label}</p></div><Link className="button" href="/matches">Nuevo partido</Link></header>
    <form className="card grid gap-3 sm:grid-cols-3"><label className="grid gap-1 text-sm font-medium">Mes<input type="month" name="month" defaultValue={month}/></label><label className="grid gap-1 text-sm font-medium">Competencia<select name="competition" defaultValue={params.competition ?? ""}><option value="">Todas</option>{competitions.map((competition) => <option value={competition.id} key={competition.id}>{competition.name}</option>)}</select></label><label className="grid gap-1 text-sm font-medium">Jugador<select name="player" defaultValue={params.player ?? ""}><option value="">Todos</option>{players.map((player) => <option value={player.id} key={player.id}>{player.name}</option>)}</select></label><button className="button sm:col-span-3" type="submit">Aplicar filtros</button></form>
    <div className="grid gap-3 md:hidden">{rows.map((row) => <article className="card" key={row.id}><div className="flex justify-between"><div><h2 className="font-bold">{row.name}</h2><p className="text-sm text-slate-600">{row.position}</p></div><strong className="text-2xl text-emerald-800">{row.minutes}<small className="ml-1 text-xs text-slate-600">min</small></strong></div><dl className="mt-3 grid grid-cols-2 border-t pt-3 text-sm"><div><dt className="text-slate-600">Partidos</dt><dd className="font-bold">{row.matches}</dd></div><div><dt className="text-slate-600">Borg promedio</dt><dd className="font-bold">{row.averageBorg?.toFixed(1) ?? "—"}</dd></div></dl></article>)}</div>
    <div className="card hidden overflow-x-auto md:block"><table className="w-full text-left text-sm"><caption className="mb-3 text-left font-bold">Minutos y Borg por jugador</caption><thead className="border-b text-slate-600"><tr><th className="p-2">Jugador</th><th className="p-2">Posición</th><th className="p-2 text-right">Minutos</th><th className="p-2 text-right">Partidos</th><th className="p-2 text-right">Borg promedio</th></tr></thead><tbody>{rows.map((row) => <tr className="border-b last:border-0" key={row.id}><td className="p-2 font-bold">{row.name}</td><td className="p-2">{row.position}</td><td className="p-2 text-right">{row.minutes}</td><td className="p-2 text-right">{row.matches}</td><td className="p-2 text-right">{row.averageBorg?.toFixed(1) ?? "—"}</td></tr>)}</tbody></table></div>
  </section>;
}
