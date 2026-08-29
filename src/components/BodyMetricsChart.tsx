"use client";

import type { BodyMetric } from "@/lib/types";
import { formatBmi, calcBmi } from "@/lib/body-metrics";

type Props = {
  metrics: BodyMetric[];
};

export function BodyMetricsChart({ metrics }: Props) {
  if (metrics.length === 0) return null;

  const weights = metrics.map((m) => m.weight_kg);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const padding = Math.max(1, (max - min) * 0.15);
  const yMin = min - padding;
  const yMax = max + padding;
  const range = yMax - yMin || 1;

  const width = 320;
  const height = 140;
  const padX = 8;
  const padY = 12;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const points = metrics.map((m, i) => {
    const x =
      metrics.length === 1
        ? padX + chartW / 2
        : padX + (i / (metrics.length - 1)) * chartW;
    const y = padY + chartH - ((m.weight_kg - yMin) / range) * chartH;
    return { x, y, metric: m };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
  const latest = metrics[metrics.length - 1];
  const bmi = calcBmi(latest.weight_kg, latest.height_cm);

  return (
    <div className="surface-card rounded-2xl p-4">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Peso
          </p>
          <p className="font-display text-2xl font-semibold">
            {latest.weight_kg.toFixed(1).replace(".", ",")} kg
          </p>
        </div>
        <p className="text-sm text-muted">
          IMC {formatBmi(bmi)} · {latest.height_cm} cm
        </p>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-36 w-full"
        aria-hidden
      >
        {[0, 0.5, 1].map((t) => {
          const y = padY + chartH * t;
          return (
            <line
              key={t}
              x1={padX}
              x2={width - padX}
              y1={y}
              y2={y}
              stroke="currentColor"
              strokeOpacity={0.08}
            />
          );
        })}
        {points.length > 1 && (
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent"
            points={polyline}
          />
        )}
        {points.map((p) => (
          <circle
            key={p.metric.id}
            cx={p.x}
            cy={p.y}
            r={4}
            className="fill-accent"
          />
        ))}
      </svg>

      <div className="mt-2 flex justify-between text-[11px] text-muted">
        <span>
          {new Date(`${metrics[0].recorded_at}T12:00:00`).toLocaleDateString(
            "pt-BR",
            { day: "2-digit", month: "short" },
          )}
        </span>
        {metrics.length > 1 && (
          <span>
            {new Date(
              `${metrics[metrics.length - 1].recorded_at}T12:00:00`,
            ).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
            })}
          </span>
        )}
      </div>
    </div>
  );
}
