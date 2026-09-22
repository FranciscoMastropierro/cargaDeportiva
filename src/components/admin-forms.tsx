"use client";

import { useActionState } from "react";
import { createClub, inviteClubUser, revokeInvitation, type AdminActionState } from "@/lib/admin-actions";

function Feedback({ state }: { state: AdminActionState }) { return <>{state.error && <p role="alert" className="form-error">{state.error}</p>}{state.success && <p role="status">{state.success}</p>}</>; }
export function CreateClubForm() {
  const [state, action, pending] = useActionState(createClub, {});
  return <form action={action} className="card space-y-3"><h2 className="text-lg font-bold">Crear club</h2><label className="grid gap-1">Nombre del club<input name="name" required maxLength={150} /></label><button className="button" disabled={pending}>{pending ? "Creando…" : "Crear club"}</button><Feedback state={state} /></form>;
}
export function InviteUserForm({ clubs, email, clubId }: { clubs: { id: string; name: string }[]; email?: string; clubId?: string }) {
  const [state, action, pending] = useActionState(inviteClubUser, {});
  return <form action={action} className="card space-y-3"><h2 className="text-lg font-bold">{email ? "Reenviar invitación" : "Invitar usuario"}</h2><label className="grid gap-1">Correo<input name="email" type="email" required defaultValue={email} readOnly={Boolean(email)} /></label><label className="grid gap-1">Club<select name="club" required defaultValue={clubId ?? ""}><option value="" disabled>Elegir club</option>{clubs.map(club => <option value={club.id} key={club.id}>{club.name}</option>)}</select></label><p className="text-sm">La invitación dura 72 horas. Al reenviar se invalida la anterior. Una cuenta de otro club no puede trasladarse.</p><button className="button" disabled={pending || !clubs.length}>{pending ? "Enviando…" : "Enviar invitación"}</button><Feedback state={state} /></form>;
}
export function RevokeInvitationForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(revokeInvitation, {});
  return <form action={action}><input type="hidden" name="id" value={id} /><button className="button button-secondary" disabled={pending}>Revocar</button><Feedback state={state} /></form>;
}
