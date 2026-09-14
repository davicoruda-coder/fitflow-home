"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BodyMetricsChart } from "@/components/BodyMetricsChart";
import { EvolutionInsightCard } from "@/components/EvolutionInsightCard";
import { ErrorBanner } from "@/components/ui";
import { saveBodyMetrics } from "@/lib/actions";
import {
  BODY_METRICS_REMINDER_DAYS,
  daysSince,
  shouldPromptBodyMetrics,
} from "@/lib/body-metrics";
import { HEIGHT_MAX, HEIGHT_MIN, WEIGHT_MAX, WEIGHT_MIN } from "@/lib/validation";
import type { BodyMetric } from "@/lib/types";

type Props = {
  metrics: BodyMetric[];
  loadFailed?: boolean;
};

export function BodyMetricsSection({ metrics, loadFailed = false }: Props) {
  const router = useRouter();
  const latest = metrics[metrics.length - 1] ?? null;
  const needsUpdate = !loadFailed && shouldPromptBodyMetrics(metrics);

  const [heightCm, setHeightCm] = useState(
    latest ? String(latest.height_cm) : "",
  );
  const [weightKg, setWeightKg] = useState("");
  const [expanded, setExpanded] = useState(needsUpdate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const daysUntilNext = useMemo(() => {
    if (!latest) return 0;
    const elapsed = daysSince(latest.recorded_at);
    return Math.max(0, BODY_METRICS_REMINDER_DAYS - elapsed);
  }, [latest]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const result = await saveBodyMetrics({ heightCm, weightKg });
    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setWeightKg("");
    setExpanded(false);
    setMessage("Medidas registradas.");
    router.refresh();
  }

  return (
    <section className="mt-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Evolução
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold">
            Altura e peso
          </h2>
          {latest && !needsUpdate && (
            <p className="mt-1 text-sm text-muted">
              Próximo check-in em {daysUntilNext} dia
              {daysUntilNext === 1 ? "" : "s"}
            </p>
          )}
        </div>
        {!needsUpdate && !loadFailed && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="shrink-0 rounded-xl border border-line bg-elevated px-3 py-2 text-sm font-semibold"
          >
            {expanded ? "Fechar" : "Atualizar"}
          </button>
        )}
      </div>

      {loadFailed && (
        <div className="mt-4 rounded-2xl border border-line bg-elevated px-4 py-3 text-sm text-muted">
          Não foi possível carregar suas medidas agora. Puxe para atualizar ou
          volte em instantes.
        </div>
      )}

      {needsUpdate && (
        <div className="mt-4 rounded-2xl border border-energy/30 bg-energy-soft px-4 py-3 text-sm text-energy">
          {metrics.length === 0
            ? "Registre sua altura e peso para acompanhar sua evolução a cada 30 dias."
            : "Já passaram 30 dias — atualize suas medidas para ver a evolução no gráfico."}
        </div>
      )}

      {!loadFailed && metrics.length > 0 && (
        <div className="mt-4">
          <BodyMetricsChart metrics={metrics} />
          <EvolutionInsightCard metrics={metrics} />
        </div>
      )}

      {(needsUpdate || expanded) && (
        <form
          onSubmit={onSubmit}
          className="surface-card mt-4 flex flex-col gap-3 rounded-2xl p-4"
        >
          {error && <ErrorBanner message={error} />}
          {message && (
            <p className="rounded-xl bg-accent-soft px-4 py-3 text-sm text-accent">
              {message}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-2 text-sm font-medium">
              Altura (cm)
              <input
                type="number"
                inputMode="decimal"
                min={HEIGHT_MIN}
                max={HEIGHT_MAX}
                step={0.1}
                required
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="175"
                className="min-h-12 rounded-xl border border-line bg-elevated px-4"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              Peso (kg)
              <input
                type="number"
                inputMode="decimal"
                min={WEIGHT_MIN}
                max={WEIGHT_MAX}
                step={0.1}
                required
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder={latest ? String(latest.weight_kg) : "78,5"}
                className="min-h-12 rounded-xl border border-line bg-elevated px-4"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary min-h-12 rounded-2xl px-6 font-semibold disabled:opacity-60"
          >
            {saving ? "Salvando…" : "Salvar medidas"}
          </button>
        </form>
      )}
    </section>
  );
}
