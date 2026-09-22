"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PasswordInput from "@/components/password-input";
import { getBrowserSupabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter(); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); const values = new FormData(event.currentTarget); const email = String(values.get("email") ?? "").trim(); const password = String(values.get("password") ?? "");
    if (!email || !/^\S+@\S+\.\S+$/.test(email) || !password) { setError("Ingresá un correo válido y tu contraseña."); return; }
    setLoading(true); const { error: authError } = await getBrowserSupabase().auth.signInWithPassword({ email, password });
    if (authError) { setError("No se pudo iniciar sesión. Revisá el correo y la contraseña."); setLoading(false); return; }
    router.replace("/dashboard"); router.refresh();
  }
  return <main className="mx-auto flex min-h-screen max-w-md items-center px-4"><form noValidate onSubmit={submit} className="card w-full space-y-4"><header><h1 className="text-2xl font-bold">JUEGASANO</h1><p className="text-sm text-slate-600">Ingresá con la cuenta de tu club.</p></header><label className="grid gap-1 text-sm font-medium">Correo electrónico<input name="email" type="email" autoComplete="email" /></label><label className="grid gap-1 text-sm font-medium">Contraseña<PasswordInput name="password" autoComplete="current-password" /></label><div className="text-right"><Link className="text-sm font-bold text-emerald-800" href="/forgot-password">Olvidé mi contraseña</Link></div>{error.trim() && <p className="form-error" role="alert">{error}</p>}<button className="button w-full" disabled={loading} type="submit">{loading ? "Ingresando…" : "Iniciar sesión"}</button></form></main>;
}
