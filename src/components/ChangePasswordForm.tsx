"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { assertPasswordNotLeaked } from "@/lib/actions";
import { ErrorBanner } from "@/components/ui";
import { PASSWORD_MIN, validatePassword } from "@/lib/validation";

type Props = {
  email: string;
};

export function ChangePasswordForm({ email }: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

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
    if (password === currentPassword) {
      setLoading(false);
      setError("A nova senha deve ser diferente da atual.");
      return;
    }

    const leak = await assertPasswordNotLeaked(password);
    if (!leak.ok) {
      setLoading(false);
      setError(leak.error);
      return;
    }

    const supabase = createClient();
    const { error: signError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (signError) {
      setLoading(false);
      setError("Senha atual incorreta.");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message || "Não foi possível alterar a senha.");
      return;
    }

    setCurrentPassword("");
    setPassword("");
    setConfirm("");
    setMessage("Senha atualizada.");
  }

  return (
    <form
      onSubmit={onSubmit}
      className="surface-card flex flex-col gap-4 rounded-2xl p-4"
    >
      <div>
        <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">
          Senha
        </h2>
        <p className="mt-1 text-sm text-muted">
          Troque a senha sem sair da conta.
        </p>
      </div>
      {error && <ErrorBanner message={error} />}
      {message && (
        <p className="rounded-xl bg-accent-soft px-4 py-3 text-sm text-accent">
          {message}
        </p>
      )}
      <label className="flex flex-col gap-2 text-sm font-medium">
        Senha atual
        <input
          type="password"
          required
          minLength={PASSWORD_MIN}
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="min-h-12 rounded-xl border border-line bg-elevated px-4"
        />
      </label>
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
        Confirmar nova senha
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
        className="btn-primary min-h-14 rounded-2xl px-6 font-semibold disabled:opacity-60"
      >
        {loading ? "Salvando…" : "Trocar senha"}
      </button>
    </form>
  );
}
