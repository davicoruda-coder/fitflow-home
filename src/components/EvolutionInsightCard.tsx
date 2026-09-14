import {
  analyzeEvolution,
  bmiBandLabel,
  formatBmi,
} from "@/lib/body-metrics";
import type { BodyMetric } from "@/lib/types";

type Props = {
  metrics: BodyMetric[];
};

const toneClass = {
  positive: "border-accent/30 bg-accent-soft text-accent",
  neutral: "border-line bg-elevated text-foreground",
  caution: "border-energy/30 bg-energy-soft text-energy",
} as const;

export function EvolutionInsightCard({ metrics }: Props) {
  const insight = analyzeEvolution(metrics);
  if (!insight) return null;

  const weeklyLabel =
    insight.weeklyKg === 0
      ? "estável"
      : `${insight.weeklyKg > 0 ? "+" : ""}${insight.weeklyKg.toFixed(2).replace(".", ",")} kg/semana`;

  return (
    <div
      className={`mt-4 rounded-2xl border px-4 py-4 text-sm ${toneClass[insight.tone]}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
        Análise da evolução
      </p>
      <p className="mt-2 font-display text-lg font-semibold leading-snug text-foreground">
        {insight.deltaLabel}
        <span className="text-sm font-normal text-muted">
          {" "}
          em ~{insight.weeks.toString().replace(".", ",")} semana
          {insight.weeks === 1 ? "" : "s"}
        </span>
      </p>
      <p className="mt-1 text-muted">
        Ritmo: {weeklyLabel}
        {Math.abs(insight.weeklyPct) >= 0.1
          ? ` (${insight.weeklyPct > 0 ? "+" : ""}${insight.weeklyPct.toFixed(1).replace(".", ",")}%/sem)`
          : ""}
      </p>
      <p className="mt-1 text-muted">
        IMC {formatBmi(insight.firstBmi)} → {formatBmi(insight.latestBmi)}
        {insight.bandChanged
          ? ` · ${bmiBandLabel(insight.firstBand)} → ${bmiBandLabel(insight.latestBand)}`
          : ` · ${bmiBandLabel(insight.latestBand)}`}
      </p>
      <p className="mt-3 leading-relaxed text-foreground">{insight.tip}</p>
    </div>
  );
}
