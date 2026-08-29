"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkPasswordLeak } from "@/lib/password-leak";
import {
  clampDurationSeconds,
  fail,
  isUuid,
  ok,
  parseNumberInput,
  sanitizeDisplayName,
  validateDisplayName,
  validateHeightCm,
  validatePassword,
  validateSchedule,
  validateStartDate,
  validateWeightKg,
  type ActionResult,
} from "@/lib/validation";

export async function assertPasswordNotLeaked(
  password: string,
): Promise<ActionResult> {
  const formatError = validatePassword(password);
  if (formatError) return fail(formatError);

  const leak = await checkPasswordLeak(password);
  if (leak === "leaked") {
    return fail("Essa senha já apareceu em vazamentos. Escolha outra.");
  }
  return ok();
}

async function requireAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null as null };
  return { supabase, user };
}

export async function saveWorkoutLog(input: {
  workoutId: string;
  durationSeconds: number;
}): Promise<ActionResult> {
  const { supabase, user } = await requireAuthUser();
  if (!user) return fail("Sessão expirada. Faça login novamente.");

  if (!isUuid(input.workoutId)) {
    return fail("Treino inválido.");
  }

  const duration = clampDurationSeconds(input.durationSeconds);

  const { data: workout, error: workoutError } = await supabase
    .from("workouts")
    .select("id")
    .eq("id", input.workoutId)
    .maybeSingle();

  if (workoutError || !workout) {
    return fail("Treino inválido.");
  }

  const { error } = await supabase.from("workout_logs").insert({
    user_id: user.id,
    workout_id: workout.id,
    duration_seconds: duration,
  });

  if (error) {
    return fail("Não foi possível salvar o treino. Tente de novo.");
  }

  revalidatePath("/hoje");
  revalidatePath("/historico");
  return ok();
}

export async function saveBodyMetrics(input: {
  heightCm: string;
  weightKg: string;
}): Promise<ActionResult> {
  const { supabase, user } = await requireAuthUser();
  if (!user) return fail("Sessão expirada. Faça login novamente.");

  const height = parseNumberInput(input.heightCm);
  const weight = parseNumberInput(input.weightKg);
  if (height == null) return fail("Informe uma altura válida (100–250 cm).");
  if (weight == null) return fail("Informe um peso válido (30–300 kg).");

  const heightError = validateHeightCm(height);
  if (heightError) return fail(heightError);
  const weightError = validateWeightKg(weight);
  if (weightError) return fail(weightError);

  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from("body_metrics").upsert(
    {
      user_id: user.id,
      recorded_at: today,
      height_cm: Math.round(height * 10) / 10,
      weight_kg: Math.round(weight * 10) / 10,
    },
    { onConflict: "user_id,recorded_at" },
  );

  if (error) {
    return fail("Não foi possível salvar. Tente de novo.");
  }

  revalidatePath("/historico");
  revalidatePath("/hoje");
  return ok();
}

export async function updateProfile(input: {
  displayName: string;
  startDate: string;
  scheduleMode: string;
  scheduleWeekdays: number[];
}): Promise<ActionResult> {
  const { supabase, user } = await requireAuthUser();
  if (!user) return fail("Sessão expirada. Faça login novamente.");

  const nameError = validateDisplayName(input.displayName);
  if (nameError) return fail(nameError);

  const dateError = validateStartDate(input.startDate);
  if (dateError) return fail(dateError);

  const schedule = validateSchedule(input.scheduleMode, input.scheduleWeekdays);
  if ("error" in schedule) return fail(schedule.error);

  const displayName = sanitizeDisplayName(input.displayName);

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName || null,
      start_date: input.startDate,
      schedule_mode: schedule.mode,
      schedule_weekdays: schedule.weekdays,
    })
    .eq("id", user.id);

  if (error) {
    return fail("Não foi possível salvar o perfil.");
  }

  revalidatePath("/perfil");
  revalidatePath("/hoje");
  return ok();
}

export async function resetUserData(): Promise<ActionResult> {
  const { supabase, user } = await requireAuthUser();
  if (!user) return fail("Sessão expirada. Faça login novamente.");

  const today = new Date().toISOString().slice(0, 10);

  const { error: logsError } = await supabase
    .from("workout_logs")
    .delete()
    .eq("user_id", user.id);

  if (logsError) {
    return fail("Não foi possível apagar os treinos.");
  }

  const { error: metricsError } = await supabase
    .from("body_metrics")
    .delete()
    .eq("user_id", user.id);

  if (metricsError) {
    return fail("Não foi possível apagar as medidas.");
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ start_date: today })
    .eq("id", user.id);

  if (profileError) {
    return fail(
      "Histórico apagado, mas o ciclo não reiniciou. Ajuste em Perfil.",
    );
  }

  revalidatePath("/historico");
  revalidatePath("/hoje");
  revalidatePath("/perfil");
  return ok();
}
