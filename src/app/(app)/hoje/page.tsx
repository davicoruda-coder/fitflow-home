import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { MetricsReminderBanner } from "@/components/MetricsReminderBanner";
import { EmptyState, ErrorBanner } from "@/components/ui";
import { shouldPromptBodyMetrics } from "@/lib/body-metrics";
import {
  formatDateLabel,
  getDayPlan,
  getNextWorkoutCode,
  toScheduleConfig,
} from "@/lib/day-plan";
import { appDateKey } from "@/lib/timezone";
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
import { splitSession } from "@/lib/workout";
import type { WorkoutExercise, WorkoutLog } from "@/lib/types";

export const metadata: Metadata = {
  title: "Hoje",
};

function findTodaysLog(logs: WorkoutLog[]): WorkoutLog | null {
  const key = appDateKey();
  return (
    logs.find((log) => appDateKey(new Date(log.completed_at)) === key) ?? null
  );
}

function sessionMetaLine(opts: {
  warmupSeconds?: number | null;
  circuitCount: number;
  cooldownCount: number;
  compact?: boolean;
}) {
  const minutes = Math.round(WORKOUT_DURATION_SECONDS / 60);
  const cooldownPart =
    opts.cooldownCount > 0 ? ` · ${opts.cooldownCount} alongamentos` : "";
  const core = `${minutes} min · ${CIRCUIT_ROUNDS} voltas · ${opts.circuitCount} exercícios${cooldownPart}`;

  if (!opts.warmupSeconds) return core;
  if (opts.compact) return `${opts.warmupSeconds}s aquecimento · ${core}`;
  return `${opts.warmupSeconds}s aquecimento + ${core}`;
}

export default async function HojePage() {
  const { user } = await requireUser();
  if (!user) redirect("/login");

  const [profile, logs, metrics] = await Promise.all([
    getProfile(user.id),
    getWorkoutLogs(user.id),
    getBodyMetrics(user.id),
  ]);

  if (!profile) {
    return (
      <div className="px-6 py-10">
        <ErrorBanner message="Perfil não encontrado. Saia da conta e entre de novo." />
      </div>
    );
  }

  const schedule = toScheduleConfig(profile);
  const plan = getDayPlan(schedule);
  const needsMetricsUpdate = shouldPromptBodyMetrics(metrics);
  const streak = calculateStreak(
    schedule,
    logs.map((l) => l.completed_at),
  );
  const todaysLog = findTodaysLog(logs);

  if (todaysLog) {
    const fallbackCode =
      plan.kind === "workout" ? plan.code : getNextWorkoutCode(schedule);
    const code = todaysLog.workout?.code ?? fallbackCode;
    const workout = todaysLog.workout ?? (await getWorkoutByCode(code));
    const minutes = Math.round(todaysLog.duration_seconds / 60);

    return (
      <div className="px-6 py-8 animate-fade-up lg:px-0 lg:py-10">
        <Header
          name={profile.display_name}
          streak={streak}
          dateLabel={formatDateLabel()}
        />

        <section className="surface-card mt-8 max-w-xl rounded-3xl p-6 lg:p-7">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Concluído hoje · {code}
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold leading-tight lg:text-3xl">
            {workout?.title ?? "Circuito concluído"}
          </h2>
          <p className="mt-2 text-sm text-muted lg:text-base">
            {minutes} min salvos · sequência {streak}
            {streak === 1 ? " dia" : " dias"}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted lg:text-base">
            Bom trabalho. Descanse o corpo — amanhã a sequência continua.
          </p>

          <Link
            href={`/treino/${code}`}
            prefetch
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl border border-line bg-elevated px-5 text-sm font-semibold"
          >
            Treinar de novo
          </Link>
        </section>

        {needsMetricsUpdate && (
          <div className="mt-10 max-w-xl">
            <MetricsReminderBanner firstTime={metrics !== null && metrics.length === 0} />
          </div>
        )}
      </div>
    );
  }

  if (plan.kind === "rest") {
    const optionalCode = getNextWorkoutCode(schedule);
    const workout = await getWorkoutByCode(optionalCode);
    const items = workout ? await getWorkoutExercises(workout.id) : [];
    const { warmup, circuit, cooldown } = splitSession(items);
    const warmupSeconds = warmup?.target_seconds ?? WARMUP_SECONDS;

    return (
      <div className="px-6 py-8 animate-fade-up lg:px-0 lg:py-10">
        <Header
          name={profile.display_name}
          streak={streak}
          dateLabel={formatDateLabel()}
        />

        <div className="mt-8 flex max-w-xl flex-col gap-6">
          <section className="surface-card rounded-3xl p-6 lg:p-7">
            <p className="text-xs font-semibold uppercase tracking-wider text-energy">
              Dia de descanso
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold lg:text-3xl">
              Descanso ativo
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted lg:text-base">
              Hoje não há circuito programado. Descanse ou caminhe 15–20 minutos
              em ritmo leve — a sequência não zera.
            </p>
            <Link
              href="/descanso"
              className="mt-5 inline-flex min-h-12 items-center justify-center rounded-2xl border border-energy/30 bg-energy-soft px-5 text-sm font-semibold text-energy"
            >
              Ver dica de caminhada
            </Link>
          </section>

          {workout && (
            <section className="rounded-3xl border border-line p-5 lg:p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Opcional
              </p>
              <h2 className="mt-2 font-display text-xl font-semibold leading-tight lg:text-2xl">
                Quer treinar mesmo assim?
              </h2>
              <p className="mt-2 text-sm text-muted">
                {workout.title} ·{" "}
                {sessionMetaLine({
                  warmupSeconds,
                  circuitCount: circuit.length,
                  cooldownCount: cooldown.length,
                  compact: true,
                })}
              </p>

              <Link
                href={`/treino/${optionalCode}`}
                prefetch
                className="mt-5 flex min-h-12 w-full items-center justify-center rounded-2xl border border-line bg-elevated px-6 text-sm font-semibold lg:max-w-xs"
              >
                Treinar mesmo assim
              </Link>

              {(warmup || circuit.length > 0 || cooldown.length > 0) && (
                <details className="mt-5">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-muted underline-offset-2 hover:underline [&::-webkit-details-marker]:hidden">
                    Ver exercícios do treino
                  </summary>
                  <div className="mt-4">
                    <ExerciseLists
                      warmup={warmup}
                      circuit={circuit}
                      cooldown={cooldown}
                    />
                  </div>
                </details>
              )}
            </section>
          )}
        </div>

        {needsMetricsUpdate && (
          <div className="mt-10 max-w-xl">
            <MetricsReminderBanner firstTime={metrics !== null && metrics.length === 0} />
          </div>
        )}
      </div>
    );
  }

  const workout = await getWorkoutByCode(plan.code);
  if (!workout) {
    return (
      <div className="px-6 py-10">
        <ErrorBanner message="Treino indisponível no momento. Atualize a página ou tente mais tarde." />
      </div>
    );
  }

  const items = await getWorkoutExercises(workout.id);
  const { warmup, circuit, cooldown } = splitSession(items);
  const warmupSeconds = warmup?.target_seconds ?? WARMUP_SECONDS;

  return (
    <div className="px-6 py-8 animate-fade-up lg:px-0 lg:py-10">
      <Header
        name={profile.display_name}
        streak={streak}
        dateLabel={formatDateLabel()}
      />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-10">
        <section>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Treino do dia · {plan.code}
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold leading-tight lg:text-3xl">
            {workout.title}
          </h2>
          <p className="mt-2 text-sm text-muted lg:text-base">
            {sessionMetaLine({
              warmupSeconds,
              circuitCount: circuit.length,
              cooldownCount: cooldown.length,
            })}
          </p>

          <Link
            href={`/treino/${plan.code}`}
            prefetch
            className="mt-6 flex min-h-14 w-full items-center justify-center rounded-2xl btn-primary px-6 text-base font-semibold lg:max-w-xs"
          >
            Começar
          </Link>
        </section>

        <ExerciseLists
          warmup={warmup}
          circuit={circuit}
          cooldown={cooldown}
        />
      </div>

      {needsMetricsUpdate && (
        <div className="mt-10 max-w-xl">
          <MetricsReminderBanner firstTime={metrics !== null && metrics.length === 0} />
        </div>
      )}
    </div>
  );
}

function ExerciseRow({ item }: { item: WorkoutExercise }) {
  return (
    <li className="surface-card flex items-center gap-3 rounded-2xl p-2.5 pr-4">
      <ExerciseThumb
        src={item.exercise.thumbnail_url || item.exercise.image_url}
        alt={item.exercise.name}
      />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-semibold leading-snug">
          {item.exercise.name}
        </p>
        <p className="mt-0.5 text-sm text-muted">
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
  cooldown,
  className = "",
}: {
  warmup: WorkoutExercise | null;
  circuit: WorkoutExercise[];
  cooldown: WorkoutExercise[];
  className?: string;
}) {
  if (!warmup && circuit.length === 0 && cooldown.length === 0) {
    return (
      <div className={className}>
        <EmptyState
          title="Sem exercícios"
          description="Os exercícios deste treino ainda não apareceram. Atualize a página ou volte mais tarde."
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
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <ExerciseRow item={warmup} />
          </ul>
        </section>
      )}
      {circuit.length > 0 && (
        <section className={warmup ? "mt-8 lg:mt-6" : undefined}>
          <h3 className="mb-3 text-sm font-semibold text-muted">No circuito</h3>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {circuit.map((item) => (
              <ExerciseRow key={item.id} item={item} />
            ))}
          </ul>
        </section>
      )}
      {cooldown.length > 0 && (
        <section
          className={warmup || circuit.length > 0 ? "mt-8 lg:mt-6" : undefined}
        >
          <h3 className="mb-3 text-sm font-semibold text-muted">
            Alongamento final
          </h3>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {cooldown.map((item) => (
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
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight lg:text-4xl">
          Olá{name ? `, ${name.split(" ")[0]}` : ""}
        </h1>
      </div>
      <div
        className="chip flex min-w-[5.75rem] shrink-0 flex-col items-center justify-center rounded-2xl px-3 py-2 text-center lg:min-w-24 lg:px-4 lg:py-3"
        title="Dias de treino seguidos. Dias de descanso não zeram a sequência."
      >
        <p className="font-display text-xl font-semibold leading-none lg:text-2xl">
          {streak}
        </p>
        <p className="mt-1 text-[0.6875rem] font-semibold uppercase">
          Sequência
        </p>
      </div>
    </header>
  );
}
