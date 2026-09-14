export type WorkoutCode = "A" | "B";

export type DayKind = "workout" | "rest";

export type ScheduleMode = "everyday" | "alternate" | "weekdays";

export type ScheduleConfig = {
  startDate: string;
  mode: ScheduleMode;
  weekdays: number[];
};

export type DayPlan =
  | { kind: "rest"; dayOffset: number }
  | { kind: "workout"; dayOffset: number; code: WorkoutCode };

export type Profile = {
  id: string;
  display_name: string | null;
  start_date: string;
  schedule_mode: ScheduleMode;
  schedule_weekdays: number[];
  created_at: string;
};

export type Exercise = {
  id: string;
  name: string;
  slug: string;
  muscles: string[];
  cues: string;
  equipment: string[];
  thumbnail_url: string | null;
  image_url: string | null;
  video_url: string | null;
};

export type Workout = {
  id: string;
  code: WorkoutCode;
  title: string;
  description: string;
};

export type WorkoutExercise = {
  id: string;
  workout_id: string;
  exercise_id: string;
  sort_order: number;
  target_reps: number | null;
  target_seconds: number | null;
  is_warmup: boolean;
  is_cooldown: boolean;
  exercise: Exercise;
};

export type WorkoutLog = {
  id: string;
  user_id: string;
  workout_id: string;
  completed_at: string;
  duration_seconds: number;
  workout?: Workout;
};

export type BodyMetric = {
  id: string;
  user_id: string;
  recorded_at: string;
  height_cm: number;
  weight_kg: number;
  created_at: string;
};
