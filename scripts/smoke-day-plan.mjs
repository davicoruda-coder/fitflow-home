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

function getNextScheduledWorkoutAfterToday(config, today) {
  const dayOffset = getDayOffset(config.startDate, today);
  for (let i = 1; i <= 28; i++) {
    const offset = dayOffset + i;
    if (!isWorkoutAtOffset(config, offset)) continue;
    const workoutIndex = countWorkoutsThroughOffset(config, offset) - 1;
    return {
      daysAway: i,
      code: workoutIndex % 2 === 0 ? "A" : "B",
      weekday: weekdayAtOffset(config.startDate, offset),
    };
  }
  return null;
}

function formatWeekdayTarget(weekday, daysAway) {
  const isMasculine = weekday === 0 || weekday === 6;
  const names = {
    0: "domingo",
    1: "segunda-feira",
    2: "terça-feira",
    3: "quarta-feira",
    4: "quinta-feira",
    5: "sexta-feira",
    6: "sábado",
  };
  const name = names[weekday] ?? "próximo treino";
  if (daysAway >= 7) {
    return isMasculine ? `no próximo ${name}` : `na próxima ${name}`;
  }
  return isMasculine ? `no ${name}` : `na ${name}`;
}

function getWorkoutCompletionMessage(config, today) {
  const next = getNextScheduledWorkoutAfterToday(config, today);
  if (!next) {
    return "Bom trabalho. Descanse o corpo — seus treinos estão em dia.";
  }
  if (next.daysAway === 1) {
    return "Bom trabalho. Descanse o corpo — amanhã a sequência continua.";
  }
  const targetDay = formatWeekdayTarget(next.weekday, next.daysAway);
  return `Bom trabalho. Descanse o corpo — amanhã é dia de descanso e a sequência continua ${targetDay}.`;
}

// Tests for completion message
// 1. Everyday mode: tomorrow always continues
const msgEvery = getWorkoutCompletionMessage(every, new Date(2026, 7, 27));
if (msgEvery !== "Bom trabalho. Descanse o corpo — amanhã a sequência continua.") {
  throw new Error(`Unexpected msgEvery: ${msgEvery}`);
}

// 2. Mon-Fri weekdays mode: on Friday 2026-09-18, tomorrow is Sat (rest), next is Mon
const monFriWeek = { startDate: "2026-09-01", mode: "weekdays", weekdays: [1, 2, 3, 4, 5] };
const msgFriday = getWorkoutCompletionMessage(monFriWeek, new Date(2026, 8, 18));
if (msgFriday !== "Bom trabalho. Descanse o corpo — amanhã é dia de descanso e a sequência continua na segunda-feira.") {
  throw new Error(`Unexpected msgFriday: ${msgFriday}`);
}

// 3. Alternate mode: on workout day, tomorrow is rest, next is day after tomorrow
const msgAlt = getWorkoutCompletionMessage(alt, new Date(2026, 7, 27)); // Thu workout -> Fri rest -> Sat next
if (msgAlt !== "Bom trabalho. Descanse o corpo — amanhã é dia de descanso e a sequência continua no sábado.") {
  throw new Error(`Unexpected msgAlt: ${msgAlt}`);
}

// 4. Once a week (Saturdays): on Saturday after workout, next is next Saturday
const satOnly = { startDate: "2026-09-01", mode: "weekdays", weekdays: [6] };
const msgSatOnly = getWorkoutCompletionMessage(satOnly, new Date(2026, 8, 19)); // Sat 2026-09-19
if (msgSatOnly !== "Bom trabalho. Descanse o corpo — amanhã é dia de descanso e a sequência continua no próximo sábado.") {
  throw new Error(`Unexpected msgSatOnly: ${msgSatOnly}`);
}

console.log("smoke-day-plan: ok");

