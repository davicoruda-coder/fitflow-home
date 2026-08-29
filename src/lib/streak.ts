import { getDayPlan, getDayOffset } from "@/lib/day-plan";
import type { ScheduleConfig } from "@/lib/types";

/**
 * Streak = consecutive planned workout days (from today backwards)
 * that have a completion log. Rest days do not break the streak.
 */
export function calculateStreak(
  config: ScheduleConfig,
  completedDates: string[],
  today: Date = new Date(),
): number {
  const completed = new Set(
    completedDates.map((d) => d.slice(0, 10)),
  );

  let streak = 0;
  const cursor = new Date(today);

  const todayPlan = getDayPlan(config, cursor);
  if (todayPlan.kind === "workout") {
    const todayKey = toKey(cursor);
    if (!completed.has(todayKey)) {
      cursor.setDate(cursor.getDate() - 1);
    }
  }

  const maxLookback = getDayOffset(config.startDate, today) + 1;

  for (let i = 0; i < maxLookback; i++) {
    const plan = getDayPlan(config, cursor);

    if (plan.kind === "rest") {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }

    const key = toKey(cursor);
    if (completed.has(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }

    break;
  }

  return streak;
}

function toKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
