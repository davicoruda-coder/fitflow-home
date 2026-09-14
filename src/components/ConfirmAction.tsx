"use client";

import { useState } from "react";

type Props = {
  triggerLabel: string;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  busyLabel?: string;
  /** danger = red destructive; caution = energy tone for mid-session exit */
  variant?: "danger" | "caution";
  triggerClassName?: string;
  onConfirm: () => void | Promise<void>;
};

export function ConfirmAction({
  triggerLabel,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  busyLabel = "Aguarde…",
  variant = "danger",
  triggerClassName = "",
  onConfirm,
}: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const isDanger = variant === "danger";
  const panelBorder = isDanger
    ? "border-danger/30 bg-danger/5"
    : "border-energy/30 bg-energy-soft";
  const titleColor = isDanger ? "text-danger" : "text-energy";
  const confirmBtn = isDanger
    ? "bg-danger text-white"
    : "btn-primary text-on-accent";
  const defaultTrigger = isDanger
    ? "min-h-14 rounded-2xl border border-danger/35 bg-elevated px-6 font-semibold text-danger"
    : "min-h-12 text-sm font-semibold text-muted underline-offset-4 hover:underline";

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
      setOpen(false);
    } catch {
      // Keep panel open so the parent can show an error
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={triggerClassName || defaultTrigger}
      >
        {triggerLabel}
      </button>
    );
  }

  return (
    <div className={`rounded-2xl border p-4 ${panelBorder}`}>
      <p className={`text-sm font-semibold ${titleColor}`}>{title}</p>
      <p className="mt-1 text-sm text-muted">{description}</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleConfirm()}
          className={`min-h-12 rounded-2xl px-5 text-sm font-semibold disabled:opacity-60 ${confirmBtn}`}
        >
          {busy ? busyLabel : confirmLabel}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setOpen(false)}
          className="min-h-12 rounded-2xl border border-line bg-elevated px-5 text-sm font-semibold"
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}
