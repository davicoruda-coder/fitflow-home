import type { ScheduleMode } from "@/lib/types";
import { appCalendarDate } from "@/lib/timezone";

export const DISPLAY_NAME_MAX = 40;
export const PASSWORD_MIN = 8;
export const DURATION_MIN = 1;
export const DURATION_MAX = 3600;
export const HEIGHT_MIN = 100;
export const HEIGHT_MAX = 250;
export const WEIGHT_MIN = 30;
export const WEIGHT_MAX = 300;

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

export function fail(error: string): ActionResult {
  return { ok: false, error };
}

export function ok(): ActionResult {
  return { ok: true };
}

export function parseNumberInput(value: string): number | null {
  const n = Number(String(value).trim().replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function sanitizeDisplayName(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, DISPLAY_NAME_MAX);
}

export function validateDisplayName(value: string): string | null {
  const name = sanitizeDisplayName(value);
  if (!name) return null;
  if (name.length > DISPLAY_NAME_MAX) {
    return `Nome deve ter no máximo ${DISPLAY_NAME_MAX} caracteres.`;
  }
  return null;
}

export function validateEmail(value: string): string | null {
  const email = value.trim();
  if (!email || email.length > 254) return "Informe um e-mail válido.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Informe um e-mail válido.";
  }
  return null;
}

export function validatePassword(value: string): string | null {
  if (value.length < PASSWORD_MIN) {
    return `Senha deve ter pelo menos ${PASSWORD_MIN} caracteres.`;
  }
  if (value.length > 128) return "Senha muito longa.";
  return null;
}

export function validateStartDate(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return "Data de início inválida.";
  }
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return "Data de início inválida.";
  }

  const todayUtc = appCalendarDate().getTime();
  const min = todayUtc - 365 * 86_400_000;
  const max = todayUtc;
  const ms = date.getTime();
  if (ms < min || ms > max) {
    return "Início do ciclo deve estar entre hoje e 1 ano atrás.";
  }
  return null;
}

export function validateHeightCm(value: number): string | null {
  if (!Number.isFinite(value) || value < HEIGHT_MIN || value > HEIGHT_MAX) {
    return `Informe uma altura válida (${HEIGHT_MIN}–${HEIGHT_MAX} cm).`;
  }
  return null;
}

export function validateWeightKg(value: number): string | null {
  if (!Number.isFinite(value) || value < WEIGHT_MIN || value > WEIGHT_MAX) {
    return `Informe um peso válido (${WEIGHT_MIN}–${WEIGHT_MAX} kg).`;
  }
  return null;
}

export function clampDurationSeconds(value: number): number {
  if (!Number.isFinite(value)) return DURATION_MIN;
  return Math.min(DURATION_MAX, Math.max(DURATION_MIN, Math.round(value)));
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

const SCHEDULE_MODES = new Set<ScheduleMode>([
  "everyday",
  "alternate",
  "weekdays",
]);

export function normalizeWeekdays(values: number[]): number[] {
  const unique = [
    ...new Set(
      values.filter((n) => Number.isInteger(n) && n >= 0 && n <= 6),
    ),
  ];
  unique.sort((a, b) => a - b);
  return unique;
}

export function validateSchedule(
  mode: string,
  weekdays: number[],
): { mode: ScheduleMode; weekdays: number[] } | { error: string } {
  if (!SCHEDULE_MODES.has(mode as ScheduleMode)) {
    return { error: "Modo de treino inválido." };
  }
  const days = normalizeWeekdays(weekdays);
  if (mode === "weekdays" && days.length < 1) {
    return { error: "Escolha pelo menos um dia da semana." };
  }
  return {
    mode: mode as ScheduleMode,
    weekdays: mode === "weekdays" ? days : [],
  };
}
