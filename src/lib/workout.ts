import type { WorkoutExercise } from "@/lib/types";

export function splitSession(items: WorkoutExercise[]) {
  return {
    warmup: items.find((item) => item.is_warmup) ?? null,
    circuit: items.filter((item) => !item.is_warmup && !item.is_cooldown),
    cooldown: items.filter((item) => item.is_cooldown),
  };
}

/** @deprecated Prefer splitSession */
export function splitWarmup(items: WorkoutExercise[]) {
  const { warmup, circuit } = splitSession(items);
  return { warmup, circuit };
}
