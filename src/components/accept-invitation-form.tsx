"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PasswordInput from "@/components/password-input";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { acceptInvitation } from "@/lib/invitation-actions";

export default function AcceptInvitationForm({ id, needsPassword }: { id: string; needsPassword: boolean }) {
  const [pending, setPending] = useState(false), [error, setError] = useState("");
  const router = useRouter();
  return <form className="space-y-4" onSubmit={async event => {
    event.preventDefault(); setError(""); const password = String(new FormData(event.currentTarget).get("password") ?? "");
    if (needsPassword && password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres."); return; }
    setPending(true);
    try {
      if (needsPassword) { const result = await getBrowserSupabase().auth.updateUser({ password }); if (result.error) { setError("No se pudo guardar la contraseña. Revisá el enlace e intentá nuevamente."); return; } }
      const result = await acceptInvitation(id);
      if (result.error) setError(result.error); else { router.replace("/dashboard"); router.refresh(); }
    } catch { setError("No se pudo confirmar la aceptación. Podés reintentar."); }
    finally { setPending(false); }
  }}>{needsPassword && <label className="grid gap-1">Creá tu contraseña<PasswordInput name="password" autoComplete="new-password" required minLength={8} disabled={pending} /></label>}{error && <p className="form-error" role="alert">{error}</p>}<button className="button" disabled={pending}>{pending ? "Aceptando…" : "Aceptar invitación"}</button></form>;
}
