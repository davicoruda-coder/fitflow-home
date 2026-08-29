import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ExerciseMedia } from "@/components/ExerciseMedia";
import { MetricsReminderBanner } from "@/components/MetricsReminderBanner";
import { EmptyState, ErrorBanner } from "@/components/ui";
import { shouldPromptBodyMetrics } from "@/lib/body-metrics";
import {
  formatDateLabel,
  getDayPlan,
  getNextWorkoutCode,
  toScheduleConfig,
} from "@/lib/day-plan";
import {
  getBodyMetrics,
  getProfile,
  getWorkoutByCode,
  getWorkoutExercises,
  getWorkoutLogs,
  requireUser,
} from "@/lib/data";
import { calculateStreak } from "@/lib/streak";
import { CIRCUIT_ROUNDS, WARMUP_SECONDS, WORKOUT_DURATION_SECONDS } from "@/lib/constants";
import { splitWarmup } from "@/lib/workout";
import type { WorkoutExercise } from "@/lib/types";

export const metadata: Metadata = {
  title: "Hoje",
};

export default async function HojePage() {
  const { user } = await requireUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (!profile) {
    return (
      <div className="px-6 py-10">
        <ErrorBanner message="Perfil não encontrado. Faça logout e entre de novo." />
      </div>
    );
  }

  const schedule = toScheduleConfig(profile);
  const plan = getDayPlan(schedule);
  const logs = await getWorkoutLogs(user.id);
  const metrics = await getBodyMetrics(user.id);
  const needsMetricsUpdate = shouldPromptBodyMetrics(metrics);
  const streak = calculateStreak(
    schedule,
    logs.map((l) => l.completed_at),
  );

  if (plan.kind === "rest") {
    const optionalCode = getNextWorkoutCode(schedule);
    const workout = await getWorkoutByCode(optionalCode);
    const items = workout ? await getWorkoutExercises(workout.id) : [];
    const { warmup, circuit } = splitWarmup(items);
    const minutes = Math.round(WORKOUT_DURATION_SECONDS / 60);
    const warmupSeconds = warmup?.target_seconds ?? WARMUP_SECONDS;

    return (
      <div className="px-6 py-8 animate-fade-up">
        <Header
          name={profile.display_name}
          streak={streak}
          dateLabel={formatDateLabel()}
        />

        {needsMetricsUpdate && (
          <MetricsReminderBanner firstTime={metrics.length === 0} />
        )}

        <section className="mt-8 surface-card rounded-3xl p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-energy">
            Dia de descanso
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold">
            Descanso ativo
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Hoje não há circuito programado. Cabe a você decidir: descanse, caminhe
            15–20 minutos em ritmo leve, ou treine mesmo assim.
          </p>
          <Link
            href="/descanso"
            className="mt-4 inline-flex min-h-12 items-center justify-center rounded-2xl border border-energy/30 bg-energy-soft px-5 text-sm font-semibold text-energy"
          >
            Ver dica de caminhada
          </Link>
        </section>

        {workout && (
          <section className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Quer treinar mesmo assim?
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold leading-tight">
              {workout.title}
            </h2>
            <p className="mt-2 text-sm text-muted">
              Treino {optionalCode}
              {warmup ? ` · ${warmupSeconds}s aquecimento` : ""} · {minutes} min ·{" "}
              {CIRCUIT_ROUNDS} voltas · {circuit.length} exercícios
            </p>

            <Link
              href={`/treino/${optionalCode}`}
              prefetch
              className="mt-6 flex min-h-14 w-full items-center justify-center rounded-2xl btn-primary px-6 text-base font-semibold lg:max-w-sm"
            >
              Treinar mesmo assim
            </Link>

            <ExerciseLists warmup={warmup} circuit={circuit} className="mt-6" />
          </section>
        )}
      </div>
    );
  }

  const workout = await getWorkoutByCode(plan.code);
  if (!workout) {
    return (
      <div className="px-6 py-10">
        <ErrorBanner message="Treino não encontrado. Rode a migration SQL no Supabase." />
      </div>
    );
  }

  const items = await getWorkoutExercises(workout.id);
  const { warmup, circuit } = splitWarmup(items);
  const minutes = Math.round(WORKOUT_DURATION_SECONDS / 60);
  const warmupSeconds = warmup?.target_seconds ?? WARMUP_SECONDS;

  return (
    <div className="px-6 py-8 animate-fade-up">
      <Header
        name={profile.display_name}
        streak={streak}
        dateLabel={formatDateLabel()}
      />

      {needsMetricsUpdate && (
        <MetricsReminderBanner firstTime={metrics.length === 0} />
      )}

      <section className="mt-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">
          Treino do dia · {plan.code}
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold leading-tight">
          {workout.title}
        </h2>
        <p className="mt-2 text-sm text-muted">
          {warmup ? `${warmupSeconds}s aquecimento + ` : ""}
          {minutes} min · {CIRCUIT_ROUNDS} voltas · {circuit.length} exercícios
        </p>

        <Link
          href={`/treino/${plan.code}`}
          prefetch
          className="mt-6 flex min-h-14 w-full items-center justify-center rounded-2xl btn-primary px-6 text-base font-semibold lg:max-w-sm"
        >
          Começar
        </Link>
      </section>

      <ExerciseLists warmup={warmup} circuit={circuit} className="mt-8" />
    </div>
  );
}

function ExerciseRow({ item }: { item: WorkoutExercise }) {
  return (
    <li className="surface-card flex items-center gap-3 rounded-2xl p-2 pr-4">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
        <ExerciseMedia
          src={item.exercise.thumbnail_url || item.exercise.image_url}
          alt={item.exercise.name}
          className="h-16 w-16"
          sizes="64px"
          thumb
        />
      </div>
      <div className="min-w-0">
        <p className="truncate font-semibold">{item.exercise.name}</p>
        <p className="text-sm text-muted">
          {item.target_seconds != null
            ? `${item.target_seconds}s`
            : `${item.target_reps ?? "—"} reps`}
        </p>
      </div>
    </li>
  );
}

function ExerciseLists({
  warmup,
  circuit,
  className = "",
}: {
  warmup: WorkoutExercise | null;
  circuit: WorkoutExercise[];
  className?: string;
}) {
  if (!warmup && circuit.length === 0) {
    return (
      <div className={className}>
        <EmptyState
          title="Sem exercícios"
          description="Rode o seed SQL para popular Treinos A e B."
        />
      </div>
    );
  }

  return (
    <div className={className}>
      {warmup && (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-muted">
            Antes do circuito
          </h3>
          <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <ExerciseRow item={warmup} />
          </ul>
        </section>
      )}
      {circuit.length > 0 && (
        <section className={warmup ? "mt-8" : undefined}>
          <h3 className="mb-3 text-sm font-semibold text-muted">No circuito</h3>
          <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {circuit.map((item) => (
              <ExerciseRow key={item.id} item={item} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Header({
  name,
  streak,
  dateLabel,
}: {
  name: string | null;
  streak: number;
  dateLabel: string;
}) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          {dateLabel}
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
          Olá{name ? `, ${name.split(" ")[0]}` : ""}
        </h1>
      </div>
      <div className="chip min-w-16 rounded-2xl px-3 py-2 text-center">
        <p className="font-display text-xl font-semibold tabular-nums">
          {streak}
        </p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em]">
          Ofensiva
        </p>
      </div>
    </header>
  );
}
