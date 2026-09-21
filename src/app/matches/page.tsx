import Link from "next/link";
import ConfirmationForm from "@/components/confirmation-form";
import { saveMatch } from "@/lib/actions";
import { getCompetitions, getMatches } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function MatchesPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const [competitions, matches] = await Promise.all([getCompetitions(false), getMatches()]);
  const { edit } = await searchParams;
  const selected = matches.find((match) => match.id === edit);
  const defaultCompetition = selected?.competition_id ?? competitions[0]?.id ?? "";

  return <section className="space-y-5"><header><h1 className="text-2xl font-bold">Partidos</h1><p className="text-sm text-slate-600">Creá el partido y luego cargá las participaciones.</p></header>
    <ConfirmationForm key={selected?.id ?? "new-match"} action={saveMatch} kind="match" confirm={Boolean(selected)} className="card grid gap-3 md:grid-cols-4"><input type="hidden" name="id" value={selected?.id ?? ""} />{selected && <div className="flex items-center justify-between md:col-span-4"><p className="text-sm font-bold text-emerald-800">Editando partido vs. {selected.opponent}</p><Link className="text-sm font-bold text-emerald-800" href="/matches">Cancelar</Link></div>}<label className="grid gap-1 text-sm font-medium">Competencia<select name="competitionId" required defaultValue={defaultCompetition}><option value="" disabled>Elegir</option>{competitions.map((competition) => <option key={competition.id} value={competition.id}>{competition.name}</option>)}</select></label><label className="grid gap-1 text-sm font-medium">Fecha<input type="date" name="matchDate" required defaultValue={selected?.match_date ?? ""} /></label><label className="grid gap-1 text-sm font-medium">Rival<input name="opponent" required placeholder="Ej. Club Central" defaultValue={selected?.opponent ?? ""} /></label><button className="button self-end" type="submit">{selected ? "Guardar cambios" : "Crear partido"}</button></ConfirmationForm>
    <div className="space-y-3">{matches.map((match) => <article key={match.id} className="card flex items-center justify-between gap-3"><div><h2 className="font-bold">vs. {match.opponent}</h2><p className="text-sm text-slate-600">{match.competitions?.name} · {new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(new Date(`${match.match_date}T12:00:00`))}</p></div><div className="flex shrink-0 gap-2"><Link className="button button-secondary" href={`/matches?edit=${match.id}`}>Editar</Link><Link className="button" href={`/matches/${match.id}`}>Cargar datos →</Link></div></article>)}</div>
  </section>;
}
