"use client";

import type { FormEvent, ReactNode } from "react";

type ServerAction = (formData: FormData) => void | Promise<void>;

export default function ConfirmationForm({ action, children, className, kind, confirm = true }: { action: ServerAction; children: ReactNode; className?: string; kind: "match" | "player" | "stats"; confirm?: boolean }) {
  function confirmSave(event: FormEvent<HTMLFormElement>) {
    if (!confirm) return;
    const values = new FormData(event.currentTarget);
    const hasStats = Array.from(values.entries()).some(([key, value]) => (key.startsWith("minutes-") || key.startsWith("borg-")) && String(value).trim() !== "");
    const message = kind === "stats" ? (hasStats ? "¿Está seguro de guardar los cambios?" : "¿Está seguro que no quiere asignar minutos?") : kind === "player" ? "¿Está seguro de guardar los cambios del jugador?" : "¿Está seguro de guardar los cambios del partido?";
    if (!window.confirm(message)) event.preventDefault();
  }
  return <form action={action} className={className} onSubmit={confirmSave}>{children}</form>;
}
