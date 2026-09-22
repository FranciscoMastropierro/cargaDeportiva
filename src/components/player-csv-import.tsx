"use client";

import { useState } from "react";
import Link from "next/link";
import { FOOTBALL_POSITIONS } from "@/types/domain";
import { analyzePlayers, MAX_CSV_BYTES, parsePlayerCsv, type CsvData, type ImportSnapshot } from "@/lib/imports/players";
import { importPlayers, refreshImportSnapshot } from "@/lib/player-management-actions";

export default function PlayerCsvImport({ initialSnapshot }: { initialSnapshot: ImportSnapshot }) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [csv, setCsv] = useState<CsvData | null>(null);
  const [nameColumn, setNameColumn] = useState(0), [positionColumn, setPositionColumn] = useState(1);
  const [corrections, setCorrections] = useState<Record<number, string>>({});
  const [choices, setChoices] = useState<Record<number, boolean>>({});
  const [confirmedDuplicates, setConfirmedDuplicates] = useState<Record<number, boolean>>({});
  const [operationId, setOperationId] = useState("");
  const [pending, setPending] = useState(false), [error, setError] = useState(""), [success, setSuccess] = useState("");
  const rows = csv ? analyzePlayers(csv, nameColumn, positionColumn, snapshot.players, corrections) : [];
  const isSelected = (index: number) => !rows[index].error && (!rows[index].duplicates.length || confirmedDuplicates[index]) && (choices[index] ?? !rows[index].duplicates.length);
  const selected = rows.filter((_, index) => isSelected(index));
  const active = snapshot.players.filter(player => player.active).length;
  function resetReview() { setChoices({}); setConfirmedDuplicates({}); setOperationId(crypto.randomUUID()); setError(""); setSuccess(""); }
  return <div className="space-y-4"><p>Club: <strong>{snapshot.clubName}</strong>. Los jugadores nuevos se cargarán activos y con estado físico Disponible.</p><p>CSV UTF-8, separado por coma o punto y coma. Máximo 1 MiB y 500 filas. Encabezados sugeridos: nombre,posicion.</p>
    <a className="button button-secondary" href="/plantilla-jugadores.csv" download>Descargar plantilla CSV</a>
    <fieldset disabled={pending || Boolean(success)} className="space-y-4"><label className="grid gap-1">Archivo CSV<input type="file" accept=".csv,text/csv" onChange={async event => {
      const file = event.target.files?.[0]; setCsv(null); setCorrections({}); resetReview(); if (!file) return;
      setPending(true);
      try {
        if (file.size > MAX_CSV_BYTES) throw new Error("El archivo supera 1 MiB.");
        let text: string; try { text = new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer()); } catch { throw new Error("Guardá el archivo con codificación UTF-8."); }
        const parsed = parsePlayerCsv(text);
        const normalized = parsed.headers.map(header => header.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
        setNameColumn(Math.max(0, normalized.indexOf("nombre"))); setPositionColumn(normalized.includes("posicion") ? normalized.indexOf("posicion") : 1); setCsv(parsed);
      } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo leer el CSV."); }
      finally { setPending(false); }
    }} /></label>
    {csv && <><div className="grid gap-3 sm:grid-cols-2">{[["Columna del nombre", nameColumn, setNameColumn], ["Columna de posición", positionColumn, setPositionColumn]].map(([label, value, setter]) => <label key={String(label)}>{String(label)}<select value={value as number} onChange={event => { (setter as (value: number) => void)(Number(event.target.value)); setCorrections({}); resetReview(); }}>{csv.headers.map((header, index) => <option key={index} value={index}>{header || `Columna ${index + 1}`}</option>)}</select></label>)}</div>
      <p>Activos: {active}/50 · Altas seleccionadas: {selected.length} · Resultado: {active + selected.length}/50 · Omitidas: {rows.length - selected.length}.</p>
      <p className="text-sm">Las coincidencias de nombre son posibles duplicados. Revisá su posición y estado antes de marcar “Es otra persona”.</p>
      <div className="overflow-x-auto"><table className="report-table"><thead><tr><th>Fila de datos</th><th>Nombre</th><th>Posición</th><th>Estado y motivo</th><th>Incluir</th></tr></thead><tbody>{rows.map((row, index) => <tr key={index}><td>{row.row}</td><td>{row.name || "Sin nombre"}</td><td><select aria-label={`Posición fila ${row.row}`} value={FOOTBALL_POSITIONS.includes(row.position as typeof FOOTBALL_POSITIONS[number]) ? row.position : ""} onChange={event => { setCorrections({ ...corrections, [index]: event.target.value }); setOperationId(crypto.randomUUID()); }}><option value="">{row.position || "Elegir posición"}</option>{FOOTBALL_POSITIONS.map(position => <option key={position}>{position}</option>)}</select></td><td>{row.error || (row.duplicates.length ? "Posible duplicado" : "Válido")}{row.duplicates.map((duplicate, n) => <p key={n}>{duplicate}</p>)}{Boolean(row.duplicates.length) && <label className="flex items-center gap-2"><input className="!w-auto" type="checkbox" checked={Boolean(confirmedDuplicates[index])} onChange={event => { setConfirmedDuplicates({ ...confirmedDuplicates, [index]: event.target.checked }); setChoices({ ...choices, [index]: event.target.checked }); setOperationId(crypto.randomUUID()); }} />Es otra persona</label>}</td><td><input className="!w-auto" aria-label={`Incluir fila ${row.row}`} type="checkbox" checked={Boolean(isSelected(index))} disabled={Boolean(row.error) || Boolean(row.duplicates.length && !confirmedDuplicates[index])} onChange={event => { setChoices({ ...choices, [index]: event.target.checked }); setOperationId(crypto.randomUUID()); }} /></td></tr>)}</tbody></table></div>
      <button className="button button-secondary" type="button" onClick={async () => { setPending(true); try { const result = await refreshImportSnapshot(); if (result.snapshot) { setSnapshot(result.snapshot); resetReview(); } else setError(result.error ?? "No se pudo actualizar."); } catch { setError("No se pudo actualizar el plantel."); } finally { setPending(false); } }}>Actualizar plantel y volver a revisar</button>
      {active + selected.length > 50 && <p className="form-error">El lote supera los 50 activos. Reducí la selección o desactivá jugadores.</p>}
      <button type="button" className="button" disabled={!selected.length || active + selected.length > 50} onClick={async () => {
        if (!window.confirm(`Se agregarán ${selected.length} jugadores al club ${snapshot.clubName}, activos y con estado Disponible. ¿Continuar?`)) return;
        setPending(true); setError("");
        try {
          const result = await importPlayers({ operationId, revision: snapshot.revision, rows: rows.flatMap((row, index) => isSelected(index) ? [{ name: row.name, position: row.position, allowDuplicate: Boolean(confirmedDuplicates[index]) }] : []) });
          if (result.error) setError(result.error); else setSuccess(`Se crearon ${result.count} jugadores. Se omitieron ${rows.length - selected.length} filas por errores, posibles duplicados o selección manual.`);
        } catch { setError("No se pudo confirmar el resultado. Reintentá sin cambiar el lote para evitar duplicados."); }
        finally { setPending(false); }
      }}>{pending ? "Procesando…" : "Confirmar importación"}</button>
    </>}
    </fieldset>{error && <p role="alert" className="form-error">{error}</p>}{success && <div role="status"><p>{success}</p><Link className="button" href="/players">Ver jugadores</Link></div>}</div>;
}
