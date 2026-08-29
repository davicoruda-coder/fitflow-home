"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { useRouter } from "next/navigation";
import { ExerciseMedia } from "@/components/ExerciseMedia";
import { ErrorBanner } from "@/components/ui";
import {
  CIRCUIT_ROUNDS,
  REST_BETWEEN_ROUNDS_SECONDS,
  WARMUP_SECONDS,
  WORKOUT_DURATION_SECONDS,
} from "@/lib/constants";
import { splitWarmup } from "@/lib/workout";
import { saveWorkoutLog } from "@/lib/actions";
import {
  signalComplete,
  signalExerciseChange,
  signalRestStart,
} from "@/lib/sounds";
import type { Workout, WorkoutExercise } from "@/lib/types";

type Phase = "warmup" | "exercise" | "rest" | "done";

type Props = {
  workout: Workout;
  exercises: WorkoutExercise[];
};

type SessionInit = {
  circuit: WorkoutExercise[];
  warmupHold: number | null;
};

type State = {
  phase: Phase;
  round: number;
  exerciseIndex: number;
  globalLeft: number;
  restLeft: number;
  holdLeft: number | null;
  elapsed: number;
  saving: boolean;
  error: string | null;
};

type Action =
  | { type: "TICK" }
  | { type: "MOVE_TO_EXERCISE"; index: number; hold: number | null }
  | { type: "START_REST" }
  | { type: "END_REST"; hold: number | null }
  | { type: "END_WARMUP"; hold: number | null }
  | { type: "FINISH_START"; elapsed: number }
  | { type: "FINISH_OK" }
  | { type: "FINISH_ERROR"; message: string };

function holdFor(exercise: WorkoutExercise | undefined): number | null {
  if (exercise?.target_seconds != null && exercise.target_seconds > 0) {
    return exercise.target_seconds;
  }
  return null;
}

function createInitialState(init: SessionInit): State {
  const hasWarmup = init.warmupHold != null;
  return {
    phase: hasWarmup ? "warmup" : "exercise",
    round: 1,
    exerciseIndex: 0,
    globalLeft: WORKOUT_DURATION_SECONDS,
    restLeft: REST_BETWEEN_ROUNDS_SECONDS,
    holdLeft: hasWarmup ? init.warmupHold : holdFor(init.circuit[0]),
    elapsed: 0,
    saving: false,
    error: null,
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "TICK": {
      if (state.phase === "done") return state;
      if (state.phase === "warmup") {
        return {
          ...state,
          holdLeft:
            state.holdLeft != null ? Math.max(0, state.holdLeft - 1) : state.holdLeft,
        };
      }
      return {
        ...state,
        globalLeft: Math.max(0, state.globalLeft - 1),
        holdLeft:
          state.phase === "exercise" && state.holdLeft != null
            ? Math.max(0, state.holdLeft - 1)
            : state.holdLeft,
        restLeft:
          state.phase === "rest" ? Math.max(0, state.restLeft - 1) : state.restLeft,
      };
    }
    case "MOVE_TO_EXERCISE":
      return {
        ...state,
        phase: "exercise",
        exerciseIndex: action.index,
        holdLeft: action.hold,
      };
    case "START_REST":
      return {
        ...state,
        phase: "rest",
        restLeft: REST_BETWEEN_ROUNDS_SECONDS,
        holdLeft: null,
      };
    case "END_REST":
      return {
        ...state,
        phase: "exercise",
        round: state.round + 1,
        exerciseIndex: 0,
        restLeft: REST_BETWEEN_ROUNDS_SECONDS,
        holdLeft: action.hold,
      };
    case "END_WARMUP":
      return {
        ...state,
        phase: "exercise",
        round: 1,
        exerciseIndex: 0,
        holdLeft: action.hold,
      };
    case "FINISH_START":
      return {
        ...state,
        phase: "done",
        elapsed: action.elapsed,
        saving: true,
        error: null,
      };
    case "FINISH_OK":
      return { ...state, saving: false };
    case "FINISH_ERROR":
      return { ...state, saving: false, error: action.message };
    default:
      return state;
  }
}

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function WorkoutSession({ workout, exercises }: Props) {
  const router = useRouter();
  const { warmup, circuit } = useMemo(() => splitWarmup(exercises), [exercises]);
  const init = useMemo<SessionInit>(
    () => ({
      circuit,
      warmupHold: warmup
        ? holdFor(warmup) ?? WARMUP_SECONDS
        : null,
    }),
    [circuit, warmup],
  );
  const [state, dispatch] = useReducer(reducer, init, createInitialState);
  const startedAtRef = useRef(0);
  const finishedRef = useRef(false);
  const restEndingRef = useRef(false);
  const warmupEndingRef = useRef(false);

  useEffect(() => {
    if (state.phase === "warmup") return;
    if (startedAtRef.current === 0) {
      startedAtRef.current = Date.now();
    }
  }, [state.phase]);

  const finish = useCallback(async () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    signalComplete();
    const start = startedAtRef.current || Date.now();
    const duration = Math.max(1, Math.round((Date.now() - start) / 1000));
    dispatch({ type: "FINISH_START", elapsed: duration });

    const result = await saveWorkoutLog({
      workoutId: workout.id,
      durationSeconds: duration,
    });

    if (!result.ok) {
      finishedRef.current = false;
      dispatch({
        type: "FINISH_ERROR",
        message: result.error,
      });
      return;
    }

    dispatch({ type: "FINISH_OK" });
    router.refresh();
  }, [router, workout.id]);

  const isDone = state.phase === "done";

  useEffect(() => {
    if (isDone) return;
    const id = window.setInterval(() => {
      dispatch({ type: "TICK" });
    }, 1000);
    return () => window.clearInterval(id);
  }, [isDone]);

  useEffect(() => {
    const prefetchUrl =
      state.phase === "warmup"
        ? circuit[0]?.exercise.video_url
        : state.phase === "exercise"
          ? circuit[state.exerciseIndex + 1]?.exercise.video_url
          : null;
    if (!prefetchUrl || typeof document === "undefined") return;
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.as = "video";
    link.href = prefetchUrl;
    document.head.appendChild(link);
    return () => {
      link.remove();
    };
  }, [circuit, state.exerciseIndex, state.phase]);

  useEffect(() => {
    if (state.phase !== "done" && state.phase !== "warmup" && state.globalLeft === 0) {
      void finish();
    }
  }, [state.globalLeft, state.phase, finish]);

  useEffect(() => {
    if (state.phase === "rest" && state.restLeft === 0 && !restEndingRef.current) {
      restEndingRef.current = true;
      signalExerciseChange();
      dispatch({ type: "END_REST", hold: holdFor(circuit[0]) });
    }
    if (state.phase === "exercise") {
      restEndingRef.current = false;
    }
  }, [state.phase, state.restLeft, circuit]);

  const startCircuit = useCallback(() => {
    if (state.phase !== "warmup") return;
    warmupEndingRef.current = true;
    signalExerciseChange();
    dispatch({ type: "END_WARMUP", hold: holdFor(circuit[0]) });
  }, [state.phase, circuit]);

  useEffect(() => {
    if (
      state.phase === "warmup" &&
      state.holdLeft === 0 &&
      !warmupEndingRef.current
    ) {
      startCircuit();
    }
    if (state.phase !== "warmup") {
      warmupEndingRef.current = false;
    }
  }, [state.phase, state.holdLeft, startCircuit]);

  const current = circuit[state.exerciseIndex];
  const progressLabel =
    state.phase === "warmup"
      ? "Antes do circuito"
      : state.phase === "rest"
        ? `Descanso · volta ${state.round}/${CIRCUIT_ROUNDS}`
        : state.phase === "done"
          ? "Concluído"
          : `Volta ${state.round}/${CIRCUIT_ROUNDS} · Exercício ${state.exerciseIndex + 1}/${circuit.length}`;

  function onNext() {
    if (state.phase !== "exercise") return;
    const isLastExercise = state.exerciseIndex >= circuit.length - 1;
    const isLastRound = state.round >= CIRCUIT_ROUNDS;

    if (!isLastExercise) {
      const nextIndex = state.exerciseIndex + 1;
      signalExerciseChange();
      dispatch({
        type: "MOVE_TO_EXERCISE",
        index: nextIndex,
        hold: holdFor(circuit[nextIndex]),
      });
      return;
    }

    if (isLastRound) {
      void finish();
      return;
    }

    signalRestStart();
    dispatch({ type: "START_REST" });
  }

  function onSkipRest() {
    if (state.phase !== "rest") return;
    signalExerciseChange();
    dispatch({ type: "END_REST", hold: holdFor(circuit[0]) });
  }

  if (state.phase === "done") {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-lg flex-col justify-center gap-6 px-4 py-10 animate-fade-up lg:max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-accent">
          Treino concluído
        </p>
        <h1 className="font-display text-3xl font-semibold leading-tight">
          Boa! {workout.code} no histórico.
        </h1>
        <p className="text-muted">
          Duração: {formatTime(state.elapsed)}.
          {state.saving ? " Salvando…" : " Ofensiva atualizada."}
        </p>
        {state.error && <ErrorBanner message={state.error} />}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => router.push("/hoje")}
            className="min-h-14 rounded-2xl btn-primary px-6 text-base font-semibold"
          >
            Voltar para Hoje
          </button>
          <button
            type="button"
            onClick={() => router.push("/historico")}
            className="min-h-14 rounded-2xl border border-line bg-elevated px-6 text-base font-semibold"
          >
            Ver histórico
          </button>
        </div>
      </div>
    );
  }

  if (state.phase === "rest") {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-lg flex-col items-center justify-center gap-6 px-4 py-10 text-center lg:max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-energy">
          Descanso entre voltas
        </p>
        <p className="animate-pulse-rest font-display text-7xl font-semibold text-energy">
          {state.restLeft}
        </p>
        <p className="text-muted">Respire. Próxima volta em breve.</p>
        <p className="text-sm text-muted">
          Timer geral {formatTime(state.globalLeft)}
        </p>
        <button
          type="button"
          onClick={onSkipRest}
          className="min-h-14 w-full max-w-xs rounded-2xl border border-line bg-elevated px-6 font-semibold"
        >
          Pular descanso
        </button>
      </div>
    );
  }

  if (state.phase === "warmup" && warmup) {
    const warmupMeta = `${warmup.target_seconds ?? WARMUP_SECONDS}s`;
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pb-8 pt-4 lg:max-w-3xl lg:px-8 lg:py-8">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-energy">
              Aquecimento
            </p>
            <p className="text-sm text-muted">{progressLabel}</p>
          </div>
          <div className="rounded-2xl border border-line bg-elevated px-4 py-2 text-center">
            <p className="font-display text-xl font-semibold tabular-nums text-muted">
              {formatTime(state.globalLeft)}
            </p>
          </div>
        </header>

        <div className="lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start lg:gap-8">
          <ExerciseMedia
            src={warmup.exercise.image_url || warmup.exercise.thumbnail_url}
            videoSrc={warmup.exercise.video_url}
            alt={warmup.exercise.name}
            priority
            className="mb-4 w-full rounded-3xl shadow-sm lg:mb-0"
          />

          <div className="flex flex-1 flex-col gap-3">
            <h1 className="font-display text-2xl font-semibold leading-tight lg:text-3xl">
              {warmup.exercise.name}
            </h1>
            <p className="text-lg font-semibold text-accent">Meta: {warmupMeta}</p>
            <p className="font-display text-4xl font-semibold tabular-nums text-energy">
              {state.holdLeft}s
            </p>
            <p className="text-sm leading-relaxed text-muted lg:text-base">
              {warmup.exercise.cues}
            </p>
            <p className="text-sm text-muted">
              O circuito de 15 min começa depois. Pode pular se já aquecer.
            </p>

            <div className="mt-6 flex flex-col gap-3 lg:mt-auto">
              <button
                type="button"
                onClick={startCircuit}
                className="min-h-14 rounded-2xl btn-primary px-6 text-base font-semibold"
              >
                Começar circuito
              </button>
              <button
                type="button"
                onClick={startCircuit}
                className="min-h-12 text-sm font-semibold text-muted underline-offset-4 hover:underline"
              >
                Pular aquecimento
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!current) {
    return <ErrorBanner message="Nenhum exercício encontrado neste treino." />;
  }

  const meta =
    current.target_seconds != null
      ? `${current.target_seconds}s`
      : `${current.target_reps ?? "—"} reps`;

  const isTimedHold = state.holdLeft != null;

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pb-8 pt-4 lg:max-w-3xl lg:px-8 lg:py-8">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Treino {workout.code}
          </p>
          <p className="text-sm text-muted">{progressLabel}</p>
        </div>
        <div className="btn-primary rounded-2xl px-4 py-2 text-center">
          <p className="font-display text-xl font-semibold tabular-nums">
            {formatTime(state.globalLeft)}
          </p>
        </div>
      </header>

      <div className="lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start lg:gap-8">
        <ExerciseMedia
          src={current.exercise.image_url || current.exercise.thumbnail_url}
          videoSrc={current.exercise.video_url}
          alt={current.exercise.name}
          priority
          className="mb-4 w-full rounded-3xl shadow-sm lg:mb-0"
        />

        <div className="flex flex-1 flex-col gap-3">
          <h1 className="font-display text-2xl font-semibold leading-tight lg:text-3xl">
            {current.exercise.name}
          </h1>
          <p className="text-lg font-semibold text-accent">Meta: {meta}</p>
          {isTimedHold && (
            <p className="font-display text-4xl font-semibold tabular-nums text-energy">
              {state.holdLeft}s
            </p>
          )}
          <p className="text-sm leading-relaxed text-muted lg:text-base">
            {current.exercise.cues}
          </p>
          {state.error && <ErrorBanner message={state.error} />}

          <div className="mt-6 flex flex-col gap-3 lg:mt-auto">
            <button
              type="button"
              onClick={onNext}
              className="min-h-14 rounded-2xl btn-primary px-6 text-base font-semibold"
            >
              {state.exerciseIndex >= circuit.length - 1 &&
              state.round >= CIRCUIT_ROUNDS
                ? "Concluir treino"
                : state.exerciseIndex >= circuit.length - 1
                  ? "Finalizar volta"
                  : "Próximo exercício"}
            </button>
            <button
              type="button"
              onClick={() => void finish()}
              className="min-h-12 text-sm font-semibold text-muted underline-offset-4 hover:underline"
            >
              Encerrar e salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
