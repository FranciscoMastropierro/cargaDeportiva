import Link from "next/link";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase/server";
import AcceptInvitationForm from "@/components/accept-invitation-form";
import { signOut } from "@/lib/actions";

export const dynamic = "force-dynamic";
export default async function AcceptInvitationPage({ searchParams }: { searchParams: Promise<{ invitation?: string }> }) {
  const { invitation } = await searchParams;
  if (!z.string().uuid().safeParse(invitation).success) return <p role="alert">Invitación inválida. Abrí el enlace enviado por correo.</p>;
  const supabase = await getSupabase();
  const { data, error } = await supabase.rpc("my_invitation", { p_id: invitation });
  return <section className="card mx-auto max-w-md space-y-4"><h1 className="text-2xl font-bold">Invitación al club</h1>{error || !data ? <p role="alert">La invitación no está disponible para esta cuenta. Abrí el enlace con el correo invitado.</p> : <><p>Club: <strong>{data.clubName}</strong></p>{data.status === "accepted" ? <Link className="button" href="/dashboard">Ir a Informes</Link> : data.valid ? <AcceptInvitationForm id={invitation!} needsPassword={data.needsPassword} /> : <p role="alert">La invitación venció o fue revocada. Pedí un nuevo enlace al administrador.</p>}</>}<form action={signOut}><button className="button button-secondary">Cerrar sesión</button></form></section>;
}
