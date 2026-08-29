import type { WorkoutExercise } from "@/lib/types";

export function splitWarmup(items: WorkoutExercise[]) {
  return {
    warmup: items.find((item) => item.is_warmup) ?? null,
    circuit: items.filter((item) => !item.is_warmup),
  };
}
