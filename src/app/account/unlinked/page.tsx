import { signOut } from "@/lib/actions";

export default function UnlinkedAccountPage() {
  return <section className="card mx-auto max-w-lg space-y-4"><h1 className="text-2xl font-bold">Tu cuenta aún no está vinculada a un club</h1><p>Para incorporarte, abrí el enlace de invitación enviado por el administrador. Si venció, pedile que lo reenvíe.</p><form action={signOut}><button className="button">Cerrar sesión</button></form></section>;
}
