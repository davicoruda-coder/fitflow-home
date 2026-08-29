"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { assertPasswordNotLeaked } from "@/lib/actions";
import { ErrorBanner } from "@/components/ui";
import { PASSWORD_MIN, validatePassword } from "@/lib/validation";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const passwordError = validatePassword(password);
    if (passwordError) {
      setLoading(false);
      setError(passwordError);
      return;
    }
    if (password !== confirm) {
      setLoading(false);
      setError("As senhas não coincidem.");
      return;
    }

    const leak = await assertPasswordNotLeaked(password);
    if (!leak.ok) {
      setLoading(false);
      setError(leak.error);
      return;
    }

    const supabase = createClient();
    const { error: authError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (authError) {
      setError(authError.message || "Não foi possível redefinir a senha.");
      return;
    }

    router.push("/hoje");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error && <ErrorBanner message={error} />}
      <label className="flex flex-col gap-2 text-sm font-medium">
        Nova senha
        <input
          type="password"
          required
          minLength={PASSWORD_MIN}
          maxLength={128}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="min-h-12 rounded-xl border border-line bg-elevated px-4"
        />
        <span className="text-xs font-normal text-muted">
          Mínimo de {PASSWORD_MIN} caracteres.
        </span>
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium">
        Confirmar senha
        <input
          type="password"
          required
          minLength={PASSWORD_MIN}
          maxLength={128}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="min-h-12 rounded-xl border border-line bg-elevated px-4"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="btn-primary box-border flex h-[3.75rem] w-full items-center justify-center rounded-2xl px-6 text-base font-semibold disabled:opacity-60"
      >
        {loading ? "Salvando…" : "Salvar nova senha"}
      </button>
    </form>
  );
}
