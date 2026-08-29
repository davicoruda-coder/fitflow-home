import { createClient } from "@/lib/supabase/server";
import type {
  BodyMetric,
  Profile,
  Workout,
  WorkoutCode,
  WorkoutExercise,
  WorkoutLog,
} from "@/lib/types";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, start_date, schedule_mode, schedule_weekdays, created_at")
    .eq("id", userId)
    .maybeSingle();
  if (!data) return null;
  return {
    ...data,
    schedule_mode: data.schedule_mode ?? "alternate",
    schedule_weekdays: data.schedule_weekdays ?? [],
  } as Profile;
}

export async function getWorkoutByCode(
  code: WorkoutCode,
): Promise<Workout | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workouts")
    .select("id, code, title, description")
    .eq("code", code)
    .maybeSingle();
  return data as Workout | null;
}

export async function getWorkoutExercises(
  workoutId: string,
): Promise<WorkoutExercise[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workout_exercises")
    .select(
      `
      id,
      workout_id,
      exercise_id,
      sort_order,
      target_reps,
      target_seconds,
      is_warmup,
      exercise:exercises (
        id,
        name,
        slug,
        muscles,
        cues,
        equipment,
        thumbnail_url,
        image_url,
        video_url
      )
    `,
    )
    .eq("workout_id", workoutId)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];

  return data.map((row) => ({
    ...row,
    is_warmup: Boolean(row.is_warmup),
    exercise: Array.isArray(row.exercise) ? row.exercise[0] : row.exercise,
  })) as WorkoutExercise[];
}

export async function getWorkoutLogs(userId: string): Promise<WorkoutLog[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workout_logs")
    .select(
      `
      id,
      user_id,
      workout_id,
      completed_at,
      duration_seconds,
      workout:workouts ( id, code, title, description )
    `,
    )
    .eq("user_id", userId)
    .order("completed_at", { ascending: false });

  if (!data) return [];

  return data.map((row) => ({
    ...row,
    workout: Array.isArray(row.workout) ? row.workout[0] : row.workout,
  })) as WorkoutLog[];
}

export async function getBodyMetrics(userId: string): Promise<BodyMetric[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("body_metrics")
    .select("id, user_id, recorded_at, height_cm, weight_kg, created_at")
    .eq("user_id", userId)
    .order("recorded_at", { ascending: true });

  if (!data) return [];

  return data.map((row) => ({
    ...row,
    height_cm: Number(row.height_cm),
    weight_kg: Number(row.weight_kg),
  })) as BodyMetric[];
}
