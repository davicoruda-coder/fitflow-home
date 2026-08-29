"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resetUserData } from "@/lib/actions";
import { ErrorBanner } from "@/components/ui";

export function ResetDataButton() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onReset() {
    setResetting(true);
    setError(null);

    const result = await resetUserData();
    setResetting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setConfirming(false);
    router.refresh();
    router.push("/hoje");
  }

  return (
    <section className="mt-12 border-t border-line pt-8">
      <h2 className="font-display text-xl font-semibold">Começar de novo</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Apaga treinos, medidas e reinicia o ciclo (hoje vira Treino A). Sua
        conta e nome permanecem.
      </p>

      {error && (
        <div className="mt-4">
          <ErrorBanner message={error} />
        </div>
      )}

      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-4 min-h-12 rounded-2xl border border-danger/30 bg-elevated px-5 text-sm font-semibold text-danger"
        >
          Resetar dados
        </button>
      ) : (
        <div className="mt-4 rounded-2xl border border-danger/30 bg-danger/5 p-4">
          <p className="text-sm font-semibold text-danger">
            Tem certeza? Isso não dá para desfazer.
          </p>
          <p className="mt-1 text-sm text-muted">
            Histórico de treinos, altura/peso e ofensiva serão zerados.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={resetting}
              onClick={onReset}
              className="min-h-12 rounded-2xl bg-danger px-5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {resetting ? "Resetando…" : "Sim, apagar tudo"}
            </button>
            <button
              type="button"
              disabled={resetting}
              onClick={() => {
                setConfirming(false);
                setError(null);
              }}
              className="min-h-12 rounded-2xl border border-line bg-elevated px-5 text-sm font-semibold"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
