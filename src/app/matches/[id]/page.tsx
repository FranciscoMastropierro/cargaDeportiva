import Link from "next/link";
import { saveMatchStats } from "@/lib/actions";
import { getMatch, getMatchStats, getPlayers } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const [match, players, stats] = await Promise.all([getMatch(id), getPlayers(false), getMatchStats(id)]); const statsByPlayer = new Map(stats.map((stat) => [stat.player_id, stat]));
  return <section className="space-y-5"><Link className="text-sm font-bold text-emerald-800" href="/matches">← Todos los partidos</Link><header><h1 className="text-2xl font-bold">vs. {match.opponent}</h1><p className="text-sm text-slate-600">{match.competitions?.name} · {new Intl.DateTimeFormat("es-AR", { dateStyle: "long" }).format(new Date(`${match.match_date}T12:00:00`))}</p></header>
    <form action={saveMatchStats} className="space-y-3"><input type="hidden" name="matchId" value={id}/><p className="text-sm text-slate-600">Dejá ambos campos vacíos si no participó. Al guardar se actualiza todo el partido.</p>{players.map((player) => { const stat = statsByPlayer.get(player.id); return <article className="card grid grid-cols-[1fr_5rem_4.5rem] items-end gap-2" key={player.id}><input type="hidden" name="playerId" value={player.id}/><div><h2 className="font-bold">{player.name}</h2><p className="text-xs text-slate-600">{player.position}</p></div><label className="grid gap-1 text-xs font-bold">Minutos<input name={`minutes-${player.id}`} type="number" min="0" inputMode="numeric" defaultValue={stat?.minutes_played} /></label><label className="grid gap-1 text-xs font-bold">Borg<input name={`borg-${player.id}`} type="number" min="0" max="10" inputMode="numeric" defaultValue={stat?.borg} /></label></article>; })}<button className="button sticky bottom-16 w-full md:bottom-4" type="submit">Guardar participación</button></form>
  </section>;
}
