export const BODY_METRICS_REMINDER_DAYS = 30;

export function daysSince(dateStr: string, today = new Date()): number {
  const recorded = new Date(`${dateStr}T12:00:00`);
  const end = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    12,
  );
  const ms = end.getTime() - recorded.getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

export function shouldPromptBodyMetrics(
  metrics: { recorded_at: string }[],
  today = new Date(),
): boolean {
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
