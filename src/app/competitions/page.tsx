import Link from "next/link";
import { saveCompetition, toggleCompetition } from "@/lib/actions";
import { getCompetitions } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function CompetitionsPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const competitions = await getCompetitions(); const { edit } = await searchParams; const selected = competitions.find((competition) => competition.id === edit);
  return <section className="space-y-5"><header><h1 className="text-2xl font-bold">Competencias</h1><p className="text-sm text-slate-600">Organizá cada partido por competencia.</p></header>
    <form action={saveCompetition} className="card flex flex-col gap-3 sm:flex-row"><input type="hidden" name="id" value={selected?.id ?? ""}/><label className="grid flex-1 gap-1 text-sm font-medium">Nombre<input name="name" defaultValue={selected?.name} required /></label><button className="button self-end" type="submit">{selected ? "Guardar cambios" : "Agregar competencia"}</button></form>
    <div className="grid gap-3 sm:grid-cols-2">{competitions.map((competition) => <article className="card flex items-center justify-between gap-3" key={competition.id}><div><h2 className="font-bold">{competition.name}</h2><p className="text-sm text-slate-600">{competition.active ? "Activa" : "Inactiva"}</p></div><div className="flex gap-2"><Link className="button button-secondary" href={`/competitions?edit=${competition.id}`}>Editar</Link><form action={toggleCompetition}><input type="hidden" name="id" value={competition.id}/><input type="hidden" name="active" value={String(competition.active)}/><button className="button button-secondary" type="submit">{competition.active ? "Desactivar" : "Activar"}</button></form></div></article>)}</div>
  </section>;
}
