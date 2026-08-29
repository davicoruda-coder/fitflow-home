"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ErrorBanner } from "@/components/ui";
import { validateEmail } from "@/lib/validation";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const emailError = validateEmail(email);
    if (emailError) {
      setLoading(false);
      setError(emailError);
      return;
    }

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/redefinir-senha`;
    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo },
    );

    setLoading(false);
    if (authError) {
      setError("Não foi possível enviar o e-mail. Tente de novo.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <p className="rounded-xl bg-accent-soft px-4 py-3 text-sm text-accent">
          Se existir uma conta com esse e-mail, enviamos um link para redefinir a
          senha. Confira a caixa de entrada e o spam.
        </p>
        <p className="text-center text-sm text-muted">
          <Link href="/login" className="font-semibold text-accent">
            Voltar ao login
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error && <ErrorBanner message={error} />}
      <label className="flex flex-col gap-2 text-sm font-medium">
        E-mail
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-h-12 rounded-xl border border-line bg-elevated px-4"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="btn-primary box-border flex h-[3.75rem] w-full items-center justify-center rounded-2xl px-6 text-base font-semibold disabled:opacity-60"
      >
        {loading ? "Enviando…" : "Enviar link"}
      </button>
      <p className="text-center text-sm text-muted">
        <Link href="/login" className="font-semibold text-accent">
          Voltar ao login
        </Link>
      </p>
    </form>
  );
}
