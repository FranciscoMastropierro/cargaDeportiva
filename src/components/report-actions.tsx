"use client";

import { useState } from "react";

export default function ReportActions({ text }: { text: string }) {
  const [status, setStatus] = useState("");
  async function copy() {
    try { await navigator.clipboard.writeText(text); setStatus("Texto copiado."); }
    catch { setStatus("No se pudo copiar. Seleccioná el texto de abajo y copialo manualmente."); }
  }
  return <section className="report-controls space-y-3"><div className="flex flex-wrap gap-2"><button className="button" type="button" onClick={copy}>Copiar texto</button><button className="button button-secondary" type="button" onClick={() => window.print()}>Imprimir / guardar PDF</button></div><p role="status">{status}</p><details><summary className="cursor-pointer">Texto para copia manual</summary><textarea aria-label="Texto del informe" className="report-copy" readOnly value={text} rows={12} onFocus={event => event.currentTarget.select()} /></details></section>;
}
