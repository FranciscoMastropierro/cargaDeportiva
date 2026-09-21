"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter(); const [error, setError] = useState(""); const [ready, setReady] = useState(false);
  useEffect(() => { getBrowserSupabase().auth.getUser().then(({ data }) => { if (data.user) setReady(true); else setError("El enlace no es válido o venció. Solicitá uno nuevo."); }); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); const password = String(new FormData(event.currentTarget).get("password") ?? "");
    if (password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres."); return; }
    const { error: updateError } = await getBrowserSupabase().auth.updateUser({ password });
    if (updateError) { setError("No se pudo actualizar la contraseña. Solicitá un enlace nuevo."); return; }
    router.replace("/dashboard"); router.refresh();
  }
  return <main className="mx-auto flex min-h-screen max-w-md items-center px-4"><form noValidate onSubmit={submit} className="card w-full space-y-4"><header><h1 className="text-2xl font-bold">Nueva contraseña</h1><p className="text-sm text-slate-600">Elegí una contraseña de al menos 8 caracteres.</p></header><label className="grid gap-1 text-sm font-medium">Contraseña nueva<input name="password" type="password" autoComplete="new-password" disabled={!ready} /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button w-full" disabled={!ready} type="submit">Guardar contraseña</button></form></main>;
}
