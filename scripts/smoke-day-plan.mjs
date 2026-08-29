/**
 * Smoke test for schedule modes (no deps).
 * Run: node scripts/smoke-day-plan.mjs
 */

function getDayOffset(startDate, today) {
  const [y, m, d] = startDate.split("-").map(Number);
  const start = Date.UTC(y, m - 1, d);
  const end = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.max(0, Math.floor((end - start) / 86_400_000));
}

function weekdayAtOffset(startDate, offset) {
  const [y, m, d] = startDate.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return (start + offset) % 7;
}

function isWorkoutAtOffset(config, offset) {
  if (config.mode === "everyday") return true;
  if (config.mode === "alternate") return offset % 2 === 0;
  return config.weekdays.includes(weekdayAtOffset(config.startDate, offset));
}

function countWorkoutsThroughOffset(config, offset) {
  let n = 0;
  for (let i = 0; i <= offset; i++) {
    if (isWorkoutAtOffset(config, i)) n += 1;
  }
  return n;
}

function getDayPlan(config, today) {
  const dayOffset = getDayOffset(config.startDate, today);
  if (!isWorkoutAtOffset(config, dayOffset)) {
    return { kind: "rest", dayOffset };
  }
  const workoutIndex = countWorkoutsThroughOffset(config, dayOffset) - 1;
  return {
    kind: "workout",
    dayOffset,
    code: workoutIndex % 2 === 0 ? "A" : "B",
  };
}

const start = "2026-08-27"; // Thursday
const alt = { startDate: start, mode: "alternate", weekdays: [] };
const p0 = getDayPlan(alt, new Date(2026, 7, 27));
const p1 = getDayPlan(alt, new Date(2026, 7, 28));
const p2 = getDayPlan(alt, new Date(2026, 7, 29));

if (!(p0.kind === "workout" && p0.code === "A")) throw new Error("alt day0");
if (p1.kind !== "rest") throw new Error("alt day1");
if (!(p2.kind === "workout" && p2.code === "B")) throw new Error("alt day2");

const every = { startDate: start, mode: "everyday", weekdays: [] };
const e0 = getDayPlan(every, new Date(2026, 7, 27));
const e1 = getDayPlan(every, new Date(2026, 7, 28));
if (!(e0.kind === "workout" && e0.code === "A")) throw new Error("every day0");
if (!(e1.kind === "workout" && e1.code === "B")) throw new Error("every day1");

// 2026-08-27 is Thursday (4). Weekend only: Fri rest, Sat workout.
const week = { startDate: start, mode: "weekdays", weekdays: [6, 0] };
const w0 = getDayPlan(week, new Date(2026, 7, 27)); // Thu
const w1 = getDayPlan(week, new Date(2026, 7, 28)); // Fri
const w2 = getDayPlan(week, new Date(2026, 7, 29)); // Sat
if (w0.kind !== "rest") throw new Error("week thu");
if (w1.kind !== "rest") throw new Error("week fri");
if (!(w2.kind === "workout" && w2.code === "A")) throw new Error("week sat");

console.log("smoke-day-plan: ok");
