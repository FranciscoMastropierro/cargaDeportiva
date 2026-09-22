import Link from "next/link";
import PlayerCsvImport from "@/components/player-csv-import";
import { refreshImportSnapshot } from "@/lib/player-management-actions";

export const dynamic = "force-dynamic";
export default async function ImportPlayersPage() {
  const { snapshot, error } = await refreshImportSnapshot();
  return <section className="space-y-5"><header><h1 className="text-2xl font-bold">Importar jugadores</h1><Link href="/players">Volver a Jugadores</Link></header>{snapshot ? <PlayerCsvImport initialSnapshot={snapshot} /> : <p role="alert" className="form-error">{error}</p>}</section>;
}
