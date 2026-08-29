"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { assertPasswordNotLeaked } from "@/lib/actions";
import { ErrorBanner } from "@/components/ui";
import {
  DISPLAY_NAME_MAX,
  PASSWORD_MIN,
  sanitizeDisplayName,
  validateEmail,
  validatePassword,
} from "@/lib/validation";

export function SignupForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
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
    const passwordError = validatePassword(password);
    if (passwordError) {
      setLoading(false);
      setError(passwordError);
      return;
    }

    const leak = await assertPasswordNotLeaked(password);
    if (!leak.ok) {
      setLoading(false);
      setError(leak.error);
      return;
    }

    const name = sanitizeDisplayName(displayName);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: name || undefined },
      },
    });
    setLoading(false);
    if (authError) {
      if (authError.message.toLowerCase().includes("already")) {
        setError("Este e-mail já está em uso.");
      } else {
        setError(authError.message || "Não foi possível criar a conta.");
      }
      return;
    }
    router.push("/hoje");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error && <ErrorBanner message={error} />}
      <label className="flex flex-col gap-2 text-sm font-medium">
        Nome
        <input
          type="text"
          value={displayName}
          maxLength={DISPLAY_NAME_MAX}
          onChange={(e) => setDisplayName(e.target.value)}
          className="min-h-12 rounded-xl border border-line bg-elevated px-4"
          placeholder="Como te chamamos"
        />
      </label>
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
      <label className="flex flex-col gap-2 text-sm font-medium">
        Senha
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
      <button
        type="submit"
        disabled={loading}
        className="btn-primary box-border flex h-[3.75rem] w-full items-center justify-center rounded-2xl px-6 text-base font-semibold disabled:opacity-60"
      >
        {loading ? "Criando…" : "Criar conta"}
      </button>
      <p className="text-center text-sm text-muted">
        Já tem conta?{" "}
        <Link href="/login" className="font-semibold text-accent">
          Entrar
        </Link>
      </p>
    </form>
  );
}
