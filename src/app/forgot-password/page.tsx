"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { getBrowserSupabase } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [notice, setNotice] = useState(""); const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); const email = String(new FormData(event.currentTarget).get("email"));
    const { error: requestError } = await getBrowserSupabase().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` });
    if (requestError) setError("No se pudo enviar el correo. Intentá nuevamente."); else setNotice("Si existe una cuenta con ese correo, recibirás un enlace para definir una contraseña nueva.");
  }
  return <main className="mx-auto flex min-h-screen max-w-md items-center px-4"><form onSubmit={submit} className="card w-full space-y-4"><header><h1 className="text-2xl font-bold">Recuperar contraseña</h1><p className="text-sm text-slate-600">Te enviaremos un enlace seguro al correo indicado.</p></header><label className="grid gap-1 text-sm font-medium">Correo electrónico<input name="email" type="email" autoComplete="email" required /></label>{notice && <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}{error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}<button className="button w-full" type="submit">Enviar enlace</button><Link className="block text-center text-sm font-bold text-emerald-800" href="/login">Volver al inicio de sesión</Link></form></main>;
}
