"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ErrorBanner } from "@/components/ui";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (authError) {
      setError("E-mail ou senha inválidos.");
      return;
    }
    router.push("/hoje");
    router.refresh();
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
      <label className="flex flex-col gap-2 text-sm font-medium">
        Senha
        <input
          type="password"
          required
          minLength={8}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="min-h-12 rounded-xl border border-line bg-elevated px-4"
        />
      </label>
      <p className="-mt-2 text-right text-sm">
        <Link href="/esqueci-senha" className="font-semibold text-accent">
          Esqueci a senha
        </Link>
      </p>
      <button
        type="submit"
        disabled={loading}
        className="btn-primary box-border flex h-[3.75rem] w-full items-center justify-center rounded-2xl px-6 text-base font-semibold shadow-[0_12px_28px_-12px_color-mix(in_srgb,var(--energy)_55%,transparent)] disabled:opacity-60"
      >
        {loading ? "Entrando…" : "Entrar"}
      </button>
      <p className="text-center text-sm text-muted">
        Não tem conta?{" "}
        <Link href="/signup" className="font-semibold text-accent">
          Criar conta
        </Link>
      </p>
    </form>
  );
}
