"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resetUserData } from "@/lib/actions";
import { ConfirmAction } from "@/components/ConfirmAction";
import { ErrorBanner } from "@/components/ui";

export function ResetDataButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function onReset() {
    setError(null);
    const result = await resetUserData();
    if (!result.ok) {
      setError(result.error);
      throw new Error(result.error);
    }
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

      <div className="mt-4">
        <ConfirmAction
          triggerLabel="Resetar dados"
          title="Tem certeza? Isso não dá para desfazer."
          description="Histórico de treinos, altura/peso e ofensiva serão zerados."
          confirmLabel="Sim, apagar tudo"
          busyLabel="Resetando…"
          variant="danger"
          triggerClassName="min-h-12 rounded-2xl border border-danger/30 bg-elevated px-5 text-sm font-semibold text-danger"
          onConfirm={onReset}
        />
      </div>
    </section>
  );
}
