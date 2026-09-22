import { notFound } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/club-context";
import { CreateClubForm, InviteUserForm, RevokeInvitationForm } from "@/components/admin-forms";

export const dynamic = "force-dynamic";
export default async function AdminPage() {
  const context = await requirePlatformAdmin().catch(() => null);
  if (!context) notFound();
  const { supabase } = context;
  const [{ data: clubs, error: clubError }, { data: invitations, error: invitationError }] = await Promise.all([
    supabase.from("clubs").select("id,name,active").order("name"),
    supabase.from("club_invitations").select("id,email,club_id,status,delivery_status,expires_at,created_at").order("created_at", { ascending: false }).limit(100),
  ]);
  if (clubError || invitationError) return <p role="alert">No se pudo cargar la administración.</p>;
  const activeClubs = (clubs ?? []).filter(club => club.active);
  return <section className="space-y-5"><header><h1 className="text-2xl font-bold">Administración</h1><p>Alta de clubes y acceso de usuarios.</p></header><div className="grid gap-4 md:grid-cols-2"><CreateClubForm /><InviteUserForm clubs={activeClubs} /></div><section className="card"><h2 className="text-lg font-bold">Clubes</h2>{clubs?.map(club => <p key={club.id}>{club.name} · {club.active ? "Activo" : "Inactivo"}</p>)}</section><h2 className="text-lg font-bold">Últimas 100 invitaciones</h2>{invitations?.map(invitation => {
    const status = invitation.status === "accepted" ? "Aceptada" : invitation.status === "revoked" ? "Revocada" : new Date(invitation.expires_at) <= new Date() ? "Vencida" : "Pendiente";
    return <article className="card space-y-3" key={invitation.id}><p className="font-bold">{invitation.email}</p><p>{clubs?.find(club => club.id === invitation.club_id)?.name} · {status} · Correo: {invitation.delivery_status === "sent" ? "enviado" : invitation.delivery_status === "failed" ? "falló" : "sin confirmar"}</p>{invitation.status === "pending" && <RevokeInvitationForm id={invitation.id} />}{invitation.status !== "accepted" && <details><summary>Reenviar</summary><InviteUserForm clubs={activeClubs} email={invitation.email} clubId={invitation.club_id} /></details>}</article>;
  })}</section>;
}
