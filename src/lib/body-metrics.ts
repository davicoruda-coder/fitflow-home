import { APP_TIMEZONE, appCalendarDate } from "@/lib/timezone";

export const BODY_METRICS_REMINDER_DAYS = 30;

export function daysSince(dateStr: string, today = new Date()): number {
  const recorded = new Date(`${dateStr}T12:00:00Z`);
  const end = appCalendarDate(today);
  end.setUTCHours(12, 0, 0, 0);
  const ms = end.getTime() - recorded.getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

export function shouldPromptBodyMetrics(
  metrics: { recorded_at: string }[] | null | undefined,
  today = new Date(),
): boolean {
  // Failed / unknown load — never nag as if the user has no data
  if (!metrics) return false;
  if (metrics.length === 0) return true;
  const latest = metrics[metrics.length - 1];
  return daysSince(latest.recorded_at, today) >= BODY_METRICS_REMINDER_DAYS;
}

export function calcBmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

export function formatBmi(bmi: number): string {
  return bmi.toFixed(1).replace(".", ",");
}

export function formatWeightDelta(current: number, previous: number): string {
  const delta = current - previous;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(1).replace(".", ",")} kg`;
}

export type BmiBand =
  | "underweight"
  | "normal"
  | "overweight"
  | "obesity";

export function bmiBand(bmi: number): BmiBand {
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "overweight";
  return "obesity";
}

export function bmiBandLabel(band: BmiBand): string {
  switch (band) {
    case "underweight":
      return "abaixo do peso";
    case "normal":
      return "faixa saudável";
    case "overweight":
      return "sobrepeso";
    case "obesity":
      return "obesidade";
  }
}

export type EvolutionInsight = {
  deltaKg: number;
  deltaLabel: string;
  weeks: number;
  weeklyKg: number;
  weeklyPct: number;
  firstBmi: number;
  latestBmi: number;
  firstBand: BmiBand;
  latestBand: BmiBand;
  bandChanged: boolean;
  tip: string;
  tone: "positive" | "neutral" | "caution";
};

/** Analysis when there are 2+ metrics. Deterministic tips — no AI. */
export function analyzeEvolution(
  metrics: { recorded_at: string; weight_kg: number; height_cm: number }[],
): EvolutionInsight | null {
  if (metrics.length < 2) return null;

  const first = metrics[0];
  const latest = metrics[metrics.length - 1];
  const deltaKg = latest.weight_kg - first.weight_kg;
  const days = Math.max(
    1,
    daysSince(first.recorded_at, new Date(`${latest.recorded_at}T12:00:00Z`)),
  );
  const weeks = days / 7;
  const weeklyKg = deltaKg / weeks;
  const weeklyPct = (weeklyKg / first.weight_kg) * 100;

  const firstBmi = calcBmi(first.weight_kg, first.height_cm);
  const latestBmi = calcBmi(latest.weight_kg, latest.height_cm);
  const firstBand = bmiBand(firstBmi);
  const latestBand = bmiBand(latestBmi);
  const bandChanged = firstBand !== latestBand;

  const absWeeklyPct = Math.abs(weeklyPct);
  let tip: string;
  let tone: EvolutionInsight["tone"] = "neutral";

  if (bandChanged && latestBand === "normal") {
    tip =
      "Marco: você entrou na faixa saudável de IMC. Mantenha o ritmo do circuito e a consistência.";
    tone = "positive";
  } else if (deltaKg < -0.2 && weeklyPct <= -1.5) {
    tip =
      "Perda rápida demais — pode custar músculo. Garanta proteína, sono e não pule os dias de treino.";
    tone = "caution";
  } else if (deltaKg < -0.2 && absWeeklyPct >= 0.25 && absWeeklyPct <= 1) {
    tip =
      "Ritmo saudável de perda. Continue com o circuito e a caminhada nos dias de descanso.";
    tone = "positive";
  } else if (deltaKg < -0.2) {
    tip =
      "Você está em tendência de perda. Mantenha a sequência — o corpo responde à consistência.";
    tone = "positive";
  } else if (Math.abs(deltaKg) <= 0.5) {
    tip =
      "Peso estável com treino em dia é comum em recomposição: pode estar ganhando músculo. Observe o espelho, não só a balança.";
    tone = "neutral";
  } else if (deltaKg > 0.5 && weeklyPct > 0.5) {
    tip =
      "Peso em alta. O treino de 15 min ajuda, mas o balanço calórico decide — revise alimentação e sono.";
    tone = "caution";
  } else {
    tip =
      "Pequena variação de peso. Continue registrando a cada 30 dias para ver a tendência com clareza.";
    tone = "neutral";
  }

  return {
    deltaKg,
    deltaLabel: formatWeightDelta(latest.weight_kg, first.weight_kg),
    weeks: Math.round(weeks * 10) / 10,
    weeklyKg: Math.round(weeklyKg * 100) / 100,
    weeklyPct: Math.round(weeklyPct * 100) / 100,
    firstBmi,
    latestBmi,
    firstBand,
    latestBand,
    bandChanged,
    tip,
    tone,
  };
}

export function formatEvolutionSummary(
  metrics: { recorded_at: string; weight_kg: number; height_cm: number }[] | null,
): string | null {
  if (!metrics || metrics.length === 0) return null;
  const latest = metrics[metrics.length - 1];
  const bmi = calcBmi(latest.weight_kg, latest.height_cm);
  const band = bmiBandLabel(bmiBand(bmi));

  if (metrics.length === 1) {
    return `${latest.weight_kg.toFixed(1).replace(".", ",")} kg · IMC ${formatBmi(bmi)} (${band})`;
  }

  const insight = analyzeEvolution(metrics);
  if (!insight) return null;

  const start = new Date(`${metrics[0].recorded_at}T12:00:00Z`).toLocaleDateString(
    "pt-BR",
    { timeZone: APP_TIMEZONE, day: "2-digit", month: "short" },
  );

  return `${insight.deltaLabel} desde ${start} · IMC ${formatBmi(insight.latestBmi)} (${band})`;
}
