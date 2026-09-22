import Papa from "papaparse";
import { FOOTBALL_POSITIONS, type Player } from "../../types/domain";

export const MAX_CSV_BYTES = 1024 * 1024;
export const MAX_CSV_ROWS = 500;
export type ImportSnapshot = { clubName: string; revision: string; players: Player[] };
export type CsvData = { headers: string[]; rows: string[][] };
export type ImportRow = { row: number; name: string; position: string; error: string; duplicates: string[] };
export function nameKey(value: string) { return value.normalize("NFC").trim().replace(/\s+/gu, " ").toLowerCase(); }
export function parsePlayerCsv(text: string): CsvData {
  if (new TextEncoder().encode(text).length > MAX_CSV_BYTES) throw new Error("El archivo supera 1 MiB.");
  const result = Papa.parse<string[]>(text.replace(/^\uFEFF/, ""), { delimitersToGuess: [",", ";"], skipEmptyLines: "greedy" });
  if (result.errors.length) throw new Error("No se pudo interpretar el CSV. Revisá separadores y comillas.");
  const [headers, ...rows] = result.data;
  if (!headers || headers.length < 2) throw new Error("El CSV debe incluir encabezados para nombre y posición.");
  if (!rows.length) throw new Error("El CSV no contiene jugadores.");
  if (rows.length > MAX_CSV_ROWS) throw new Error("El archivo supera las 500 filas de datos.");
  return { headers, rows };
}
export function analyzePlayers(csv: CsvData, nameColumn: number, positionColumn: number, players: Player[], corrections: Record<number, string> = {}): ImportRow[] {
  const names = csv.rows.map(row => (row[nameColumn] ?? "").trim().replace(/\s+/gu, " "));
  const counts = new Map<string, number>();
  for (const name of names) counts.set(nameKey(name), (counts.get(nameKey(name)) ?? 0) + 1);
  return csv.rows.map((cells, index) => {
    const name = names[index];
    const rawPosition = corrections[index] ?? cells[positionColumn] ?? "";
    const position = FOOTBALL_POSITIONS.find(value => nameKey(value) === nameKey(rawPosition)) ?? rawPosition.trim();
    const error = nameColumn < 0 || positionColumn < 0 || nameColumn === positionColumn ? "Elegí dos columnas distintas." : cells.length !== csv.headers.length ? "Cantidad de columnas incorrecta." : !name ? "Falta el nombre." : !FOOTBALL_POSITIONS.includes(position as typeof FOOTBALL_POSITIONS[number]) ? "Elegí una posición válida; no se infieren equivalencias." : "";
    const duplicates = players.filter(player => nameKey(player.name) === nameKey(name)).map(player => `${player.name} · ${player.position} · ${player.active ? "Activo" : "Inactivo"}`);
    if ((counts.get(nameKey(name)) ?? 0) > 1) duplicates.push("Nombre repetido dentro del CSV");
    return { row: index + 2, name, position, error, duplicates };
  });
}
