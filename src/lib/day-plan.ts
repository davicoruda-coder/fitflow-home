import type { DayPlan, Profile, ScheduleConfig, ScheduleMode, WorkoutCode } from "@/lib/types";
import { APP_TIMEZONE, appCalendarDate, appDateKey } from "@/lib/timezone";

function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toScheduleConfig(profile: Profile): ScheduleConfig {
  return {
    startDate: profile.start_date,
    mode: profile.schedule_mode,
    weekdays: profile.schedule_weekdays,
  };
}

/** Days between start_date and today (app timezone calendar days). */
export function getDayOffset(startDate: string, today: Date = new Date()): number {
  const start = parseDateOnly(startDate);
  const end = appCalendarDate(today);
  const ms = end.getTime() - start.getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

function weekdayAtOffset(startDate: string, offset: number): number {
  const start = parseDateOnly(startDate).getUTCDay();
  return (start + offset) % 7;
}

export function isWorkoutAtOffset(config: ScheduleConfig, offset: number): boolean {
  if (config.mode === "everyday") return true;
  if (config.mode === "alternate") return offset % 2 === 0;
  const set = new Set(config.weekdays);
  return set.has(weekdayAtOffset(config.startDate, offset));
}

function countWorkoutsThroughOffset(config: ScheduleConfig, offset: number): number {
  let n = 0;
  for (let i = 0; i <= offset; i++) {
    if (isWorkoutAtOffset(config, i)) n += 1;
  }
  return n;
}

function codeForWorkoutIndex(workoutIndex: number): WorkoutCode {
  return workoutIndex % 2 === 0 ? "A" : "B";
}

/**
 * Planned day from the profile schedule:
 * - everyday: train every calendar day
 * - alternate: even offset = workout, odd = rest (legacy dia sim / dia não)
 * - weekdays: train on selected JS weekdays (0=Dom … 6=Sáb)
 * A/B alternates across scheduled workout days from start_date.
 */
export function getDayPlan(
  config: ScheduleConfig,
  today: Date = new Date(),
): DayPlan {
  const dayOffset = getDayOffset(config.startDate, today);

  if (!isWorkoutAtOffset(config, dayOffset)) {
    return { kind: "rest", dayOffset };
  }

  const workoutIndex = countWorkoutsThroughOffset(config, dayOffset) - 1;
  return {
    kind: "workout",
    dayOffset,
    code: codeForWorkoutIndex(workoutIndex),
  };
}

/** Workout scheduled for today if it's a training day, otherwise the next one. */
export function getNextWorkoutCode(
  config: ScheduleConfig,
  today: Date = new Date(),
): WorkoutCode {
  const dayOffset = getDayOffset(config.startDate, today);
  for (let i = 0; i < 14; i++) {
    const offset = dayOffset + i;
    if (!isWorkoutAtOffset(config, offset)) continue;
    const workoutIndex = countWorkoutsThroughOffset(config, offset) - 1;
    return codeForWorkoutIndex(workoutIndex);
  }
  return "A";
}

export function formatDateLabel(date: Date = new Date()): string {
  return date.toLocaleDateString("pt-BR", {
    timeZone: APP_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/** Re-export for callers that need the app calendar key. */
export { appDateKey };

export const SCHEDULE_MODES: { value: ScheduleMode; label: string; hint: string }[] = [
  {
    value: "everyday",
    label: "Todo dia",
    hint: "Circuito A/B todos os dias.",
  },
  {
    value: "alternate",
    label: "Dia sim / dia não",
    hint: "Um dia de treino, um de descanso.",
  },
  {
    value: "weekdays",
    label: "Dias da semana",
    hint: "Você escolhe os dias, inclusive fim de semana.",
  },
];

export const WEEKDAY_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
];
