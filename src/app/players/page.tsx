import Link from "next/link";
import { savePlayer, togglePlayer } from "@/lib/actions";
import { getPlayers } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function PlayersPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const players = await getPlayers(); const { edit } = await searchParams; const selected = players.find((player) => player.id === edit);
  return <section className="space-y-5"><header><h1 className="text-2xl font-bold">Jugadores</h1><p className="text-sm text-slate-600">Administrá el plantel activo.</p></header>
    <form action={savePlayer} className="card grid gap-3 md:grid-cols-3"><input type="hidden" name="id" value={selected?.id ?? ""}/><label className="grid gap-1 text-sm font-medium">Nombre<input name="name" defaultValue={selected?.name} required /></label><label className="grid gap-1 text-sm font-medium">Posición<input name="position" defaultValue={selected?.position} required /></label><button className="button self-end" type="submit">{selected ? "Guardar cambios" : "Agregar jugador"}</button></form>
    <div className="grid gap-3 sm:grid-cols-2">{players.map((player) => <article className="card flex items-center justify-between gap-3" key={player.id}><div><h2 className="font-bold">{player.name}</h2><p className="text-sm text-slate-600">{player.position} · {player.active ? "Activo" : "Inactivo"}</p></div><div className="flex gap-2"><Link className="button button-secondary" href={`/players?edit=${player.id}`}>Editar</Link><form action={togglePlayer}><input type="hidden" name="id" value={player.id}/><input type="hidden" name="active" value={String(player.active)}/><button className="button button-secondary" type="submit">{player.active ? "Desactivar" : "Activar"}</button></form></div></article>)}</div>
  </section>;
}
