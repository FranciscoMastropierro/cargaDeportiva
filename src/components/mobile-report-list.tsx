"use client";

import { useState } from "react";
import type { DashboardRow } from "@/types/domain";

function frequencyClass(matches: number) { return matches >= 5 ? "text-red-700" : matches === 4 ? "text-orange-700" : matches === 3 ? "text-amber-700" : ""; }

export default function MobileReportList({ rows }: { rows: DashboardRow[] }) {
  const [expanded, setExpanded] = useState(false);
  const visibleRows = expanded ? rows : rows.slice(0, 10);
  return <div className="grid gap-3 md:hidden">{visibleRows.map((row) => <article className="card" key={row.id}><div className="flex justify-between"><div><h2 className={`font-bold ${frequencyClass(row.recentMatches)}`}>{row.name}</h2><p className="text-sm text-slate-600">{row.position} · {row.recentMatches} recientes</p></div><strong className="text-2xl text-emerald-800">{row.minutes}<small className="ml-1 text-xs text-slate-600">min</small></strong></div></article>)}{rows.length > 10 && <button className="button button-secondary" type="button" onClick={() => setExpanded((value) => !value)}>{expanded ? "Mostrar menos" : "Mostrar más jugadores"}</button>}</div>;
}
