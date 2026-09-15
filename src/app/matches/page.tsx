import Link from "next/link";
import { saveMatch } from "@/lib/actions";
import { getCompetitions, getMatches } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const [competitions, matches] = await Promise.all([getCompetitions(false), getMatches()]);
  return <section className="space-y-5"><header><h1 className="text-2xl font-bold">Partidos</h1><p className="text-sm text-slate-600">Creá el partido y luego cargá las participaciones.</p></header>
    <form action={saveMatch} className="card grid gap-3 md:grid-cols-4"><label className="grid gap-1 text-sm font-medium">Competencia<select name="competitionId" required defaultValue=""><option value="" disabled>Elegir</option>{competitions.map((competition) => <option key={competition.id} value={competition.id}>{competition.name}</option>)}</select></label><label className="grid gap-1 text-sm font-medium">Fecha<input type="date" name="matchDate" required /></label><label className="grid gap-1 text-sm font-medium">Rival<input name="opponent" required placeholder="Ej. Club Central" /></label><button className="button self-end" type="submit">Crear partido</button></form>
    <div className="space-y-3">{matches.map((match) => <Link key={match.id} href={`/matches/${match.id}`} className="card flex items-center justify-between text-inherit no-underline"><div><h2 className="font-bold">vs. {match.opponent}</h2><p className="text-sm text-slate-600">{match.competitions?.name} · {new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(new Date(`${match.match_date}T12:00:00`))}</p></div><span className="text-sm font-bold text-emerald-800">Cargar datos →</span></Link>)}</div>
  </section>;
}
