"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getBrowserSupabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter(); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setLoading(true);
    const values = new FormData(event.currentTarget);
    const { error: authError } = await getBrowserSupabase().auth.signInWithPassword({ email: String(values.get("email")), password: String(values.get("password")) });
    if (authError) { setError("No se pudo iniciar sesión. Revisá el correo y la contraseña."); setLoading(false); return; }
    router.replace("/dashboard"); router.refresh();
  }
  return <main className="mx-auto flex min-h-screen max-w-md items-center px-4"><form onSubmit={submit} className="card w-full space-y-4"><header><h1 className="text-2xl font-bold">Carga Deportiva</h1><p className="text-sm text-slate-600">Ingresá con la cuenta de tu club.</p></header><label className="grid gap-1 text-sm font-medium">Correo electrónico<input name="email" type="email" autoComplete="email" required /></label><label className="grid gap-1 text-sm font-medium">Contraseña<input name="password" type="password" autoComplete="current-password" required /></label><div className="text-right"><Link className="text-sm font-bold text-emerald-800" href="/forgot-password">Olvidé mi contraseña</Link></div>{error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}<button className="button w-full" disabled={loading} type="submit">{loading ? "Ingresando…" : "Iniciar sesión"}</button></form></main>;
}
