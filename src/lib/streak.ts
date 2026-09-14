import { getDayPlan, getDayOffset } from "@/lib/day-plan";
import { appDateKey, shiftDateKey } from "@/lib/timezone";
import type { ScheduleConfig } from "@/lib/types";

/**
 * Streak = consecutive planned workout days (from today backwards)
 * that have a completion log. Rest days do not break the streak.
 * Calendar days use America/Sao_Paulo so evening UTC doesn't skip ahead.
 */
export function calculateStreak(
  config: ScheduleConfig,
  completedDates: string[],
  today: Date = new Date(),
): number {
  const completed = new Set(
    completedDates.map((d) => appDateKey(new Date(d))),
  );

  let streak = 0;
  let cursorKey = appDateKey(today);

  const todayPlan = getDayPlan(config, today);
  if (todayPlan.kind === "workout") {
    if (!completed.has(cursorKey)) {
      cursorKey = shiftDateKey(cursorKey, -1);
    }
  }

  const maxLookback = getDayOffset(config.startDate, today) + 1;

  for (let i = 0; i < maxLookback; i++) {
    const [y, m, d] = cursorKey.split("-").map(Number);
    const cursorDate = new Date(Date.UTC(y, m - 1, d, 12));
    const plan = getDayPlan(config, cursorDate);

    if (plan.kind === "rest") {
      cursorKey = shiftDateKey(cursorKey, -1);
      continue;
    }

    if (completed.has(cursorKey)) {
      streak += 1;
      cursorKey = shiftDateKey(cursorKey, -1);
      continue;
    }

    break;
  }

  return streak;
}
