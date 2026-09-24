"use client";

import { useState } from "react";

type Period = "month" | "year" | "total";
type Option = { id: string; name: string };

export default function DashboardFilters({
  initialPeriod,
  initialDate,
  competitions,
  players,
  years,
  competition,
  player,
}: {
  initialPeriod: Period;
  initialDate: string;
  competitions: Option[];
  players: Option[];
  years: string[];
  competition?: string;
  player?: string;
}) {
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [month, setMonth] = useState(initialDate.length === 7 ? initialDate : `${initialDate.slice(0, 4)}-01`);
  const [year, setYear] = useState(initialPeriod === "year" ? initialDate.slice(0, 4) : years[0] ?? initialDate.slice(0, 4));

  return <form action="/dashboard" method="get" className="card grid gap-3 sm:grid-cols-4">
    <label className="grid gap-1 text-sm font-medium">Período
      <select name="period" value={period} onChange={(event) => setPeriod(event.target.value as Period)}>
        <option value="month">Mensual</option>
        <option value="year">Anual</option>
        <option value="total">Total</option>
      </select>
    </label>

    {period === "month" && <label className="grid gap-1 text-sm font-medium">Mes
      <input type="month" name="date" required value={month} onChange={(event) => setMonth(event.target.value)} />
    </label>}

    {period === "year" && <label className="grid gap-1 text-sm font-medium">Año
      <select name="date" required value={year} onChange={(event) => setYear(event.target.value)}>
        {years.map((availableYear) => <option key={availableYear} value={availableYear}>{availableYear}</option>)}
      </select>
    </label>}

    {period === "total" && <div className="grid content-center gap-1 text-sm" aria-live="polite">
      <span className="font-medium">Fecha</span>
      <span className="text-slate-600">Se incluirá todo el historial.</span>
    </div>}

    <label className="grid gap-1 text-sm font-medium">Competencia
      <select name="competition" defaultValue={competition ?? ""}><option value="">Todas</option>{competitions.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select>
    </label>
    <label className="grid gap-1 text-sm font-medium">Jugador
      <select name="player" defaultValue={player ?? ""}><option value="">Todos</option>{players.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select>
    </label>
    <button className="button sm:col-span-4" type="submit">Aplicar filtros</button>
  </form>;
}
