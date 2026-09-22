import { redirect } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase/server";

async function confirmEmail(formData: FormData) {
  "use server";
  const parsed = z.object({ token: z.string().min(1).max(2048), type: z.enum(["invite", "email"]), invitation: z.string().uuid() }).safeParse({ token: formData.get("token"), type: formData.get("type"), invitation: formData.get("invitation") });
  if (!parsed.success) redirect("/auth/confirm?error=invalid");
  const supabase = await getSupabase();
  const { error } = await supabase.auth.verifyOtp({ token_hash: parsed.data.token, type: parsed.data.type });
  if (error) redirect("/auth/confirm?error=expired");
  redirect(`/invitations/accept?invitation=${parsed.data.invitation}`);
}
export default async function ConfirmEmailPage({ searchParams }: { searchParams: Promise<{ token_hash?: string; type?: string; invitation?: string }> }) {
  const params = await searchParams;
  const valid = typeof params.token_hash === "string" && params.token_hash.length <= 2048 && (params.type === "invite" || params.type === "email") && z.string().uuid().safeParse(params.invitation).success;
  return <section className="card mx-auto max-w-md space-y-4"><h1 className="text-2xl font-bold">Confirmar correo</h1>{valid ? <form action={confirmEmail} className="space-y-4"><p>Continuá para verificar tu correo y revisar la invitación al club.</p><input type="hidden" name="token" value={params.token_hash} /><input type="hidden" name="type" value={params.type} /><input type="hidden" name="invitation" value={params.invitation} /><button className="button">Continuar</button></form> : <><p role="alert">El enlace no es válido, ya fue usado o venció. Pedí al administrador que reenvíe la invitación.</p><Link href="/login">Ir al inicio de sesión</Link></>}</section>;
}
