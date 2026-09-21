"use client";

import { useState, type FormEvent, type ReactNode } from "react";

type ServerAction = (formData: FormData) => void | Promise<void>;

export default function ConfirmationForm({ action, children, className, kind, confirm = true }: { action: ServerAction; children: ReactNode; className?: string; kind: "match" | "player" | "stats" | "competition"; confirm?: boolean }) {
  const [validationError, setValidationError] = useState("");
  function confirmSave(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const invalid = Array.from(form.elements).find((element) => {
      if (!(element instanceof HTMLInputElement || element instanceof HTMLSelectElement) || element.disabled) return false;
      if (element.required && !element.value.trim()) return true;
      if (element instanceof HTMLInputElement && element.type === "email" && element.value && !/^\S+@\S+\.\S+$/.test(element.value)) return true;
      if (element instanceof HTMLInputElement && element.type === "number" && element.value && ((element.min && Number(element.value) < Number(element.min)) || (element.max && Number(element.value) > Number(element.max)))) return true;
      return false;
    });
    if (invalid) { event.preventDefault(); setValidationError("Revisá los campos obligatorios y los valores permitidos."); return; }
    setValidationError("");
    if (!confirm) return;
    const values = new FormData(form);
    const hasStats = Array.from(values.entries()).some(([key, value]) => (key.startsWith("minutes-") || key.startsWith("borg-")) && String(value).trim() !== "");
    const message = kind === "stats" ? (hasStats ? "¿Está seguro de guardar los cambios?" : "¿Está seguro que no quiere asignar minutos?") : kind === "player" ? "¿Está seguro de guardar los cambios del jugador?" : kind === "competition" ? "¿Está seguro de guardar los cambios de la competencia?" : "¿Está seguro de guardar los cambios del partido?";
    if (!window.confirm(message)) event.preventDefault();
  }
  return <form action={action} className={className} noValidate onSubmit={confirmSave}>{validationError && <p className="form-error" role="alert">{validationError}</p>}{children}</form>;
}
