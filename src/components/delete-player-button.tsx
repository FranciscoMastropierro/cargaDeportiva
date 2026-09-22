"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deletePlayer } from "@/lib/player-management-actions";

export default function DeletePlayerButton({ id, name }: { id: string; name: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  return <div><button className="button button-secondary" type="button" disabled={pending} onClick={async () => {
    if (!window.confirm(`¿Está seguro de eliminar a ${name}? Se eliminarán también todas sus estadísticas e historial de participaciones. Esta acción no se puede deshacer.`)) return;
    setPending(true); setError("");
    const data = new FormData(); data.set("id", id); data.set("confirmed", "true");
    try { const result = await deletePlayer(data); if (result.error) setError(result.error); else router.refresh(); }
    catch { setError("No se pudo confirmar el resultado. Actualizá el plantel antes de reintentar."); }
    finally { setPending(false); }
  }}>{pending ? "Eliminando…" : "Eliminar"}</button>{error && <p className="form-error" role="alert">{error}</p>}</div>;
}
