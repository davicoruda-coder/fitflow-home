"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { useRouter } from "next/navigation";
import { ExerciseMedia } from "@/components/ExerciseMedia";
import { ConfirmAction } from "@/components/ConfirmAction";
import { ErrorBanner } from "@/components/ui";
import {
  CIRCUIT_ROUNDS,
  COOLDOWN_TRANSITION_SECONDS,
  REST_BETWEEN_ROUNDS_SECONDS,
  WARMUP_SECONDS,
  WORKOUT_DURATION_SECONDS,
} from "@/lib/constants";
import { splitSession } from "@/lib/workout";
import { saveWorkoutLog } from "@/lib/actions";
import {
  signalComplete,
  signalCountdownTick,
  signalExerciseChange,
  signalRestStart,
  signalTimerDone,
  stopTimerDone,
  unlockAudio,
} from "@/lib/sounds";
import type { Workout, WorkoutExercise } from "@/lib/types";

type Phase = "warmup" | "exercise" | "rest" | "cooldown" | "done";

type Props = {
  workout: Workout;
  exercises: WorkoutExercise[];
};

type SessionInit = {
  circuit: WorkoutExercise[];
  cooldown: WorkoutExercise[];
  warmupHold: number | null;
};

type State = {
  phase: Phase;
  round: number;
  exerciseIndex: number;
  cooldownIndex: number;
  cooldownTotal: number;
  cooldownTransitionLeft: number | null;
  isCooldownTransitionPaused: boolean;
  globalLeft: number;
  restLeft: number;
  holdLeft: number | null;
  holdTotal: number | null;
  isHoldRunning: boolean;
  holdCompleted: boolean;
  globalExpired: boolean;
  elapsed: number;
  saving: boolean;
  error: string | null;
};

type Action =
  | { type: "TICK" }
  | { type: "START_HOLD" }
  | { type: "PAUSE_HOLD" }
  | { type: "RESET_HOLD" }
  | { type: "MOVE_TO_EXERCISE"; index: number; hold: number | null }
  | { type: "START_REST" }
  | { type: "END_REST"; hold: number | null }
  | { type: "END_WARMUP"; hold: number | null }
  | { type: "START_COOLDOWN"; hold: number | null; elapsed: number }
  | {
      type: "MOVE_COOLDOWN";
      index: number;
      hold: number | null;
      autoStart?: boolean;
    }
  | { type: "START_COOLDOWN_TRANSITION" }
  | { type: "PAUSE_COOLDOWN_TRANSITION" }
  | { type: "RESUME_COOLDOWN_TRANSITION" }
  | { type: "CANCEL_COOLDOWN_TRANSITION" }
  | { type: "FINISH_START"; elapsed: number }
  | { type: "FINISH_OK" }
  | { type: "FINISH_ERROR"; message: string };

function PlayIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <polygon points="6 4 20 12 6 20 6 4" />
    </svg>
  );
}

function PauseIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <rect x="6" y="4" width="4" height="16" rx="1.5" />
      <rect x="14" y="4" width="4" height="16" rx="1.5" />
    </svg>
  );
}

function RotateCcwIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

function CheckCircleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function holdFor(exercise: WorkoutExercise | undefined): number | null {
  if (exercise?.target_seconds != null && exercise.target_seconds > 0) {
    return exercise.target_seconds;
  }
  return null;
}

function createInitialState(init: SessionInit): State {
  const hasWarmup = init.warmupHold != null;
  const initialHold = hasWarmup ? init.warmupHold : holdFor(init.circuit[0]);
  return {
    phase: hasWarmup ? "warmup" : "exercise",
    round: 1,
    exerciseIndex: 0,
    cooldownIndex: 0,
    cooldownTotal: init.cooldown.length,
    cooldownTransitionLeft: null,
    isCooldownTransitionPaused: false,
    globalLeft: WORKOUT_DURATION_SECONDS,
    restLeft: REST_BETWEEN_ROUNDS_SECONDS,
    holdLeft: initialHold,
    holdTotal: initialHold,
    isHoldRunning: false,
    holdCompleted: false,
    globalExpired: false,
    elapsed: 0,
    saving: false,
    error: null,
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "START_HOLD":
      return {
        ...state,
        isHoldRunning: true,
        cooldownTransitionLeft: null,
        isCooldownTransitionPaused: false,
      };
    case "PAUSE_HOLD":
      return {
        ...state,
        isHoldRunning: false,
      };
    case "RESET_HOLD":
      return {
        ...state,
        holdLeft: state.holdTotal,
        isHoldRunning: false,
        holdCompleted: false,
        cooldownTransitionLeft: null,
        isCooldownTransitionPaused: false,
      };
    case "TICK": {
      if (state.phase === "done") return state;

      // In warmup or cooldown: globalLeft does not tick
      if (state.phase === "warmup" || state.phase === "cooldown") {
        if (state.phase === "cooldown" && state.cooldownTransitionLeft != null) {
          if (state.isCooldownTransitionPaused) {
            return state;
          }
          const nextTransition = Math.max(0, state.cooldownTransitionLeft - 1);
          return {
            ...state,
            cooldownTransitionLeft: nextTransition,
          };
        }

        if (!state.isHoldRunning || state.holdLeft == null || state.holdLeft <= 0) {
          return state;
        }
        const nextHold = state.holdLeft - 1;
        const willComplete = nextHold === 0;
        const shouldStartTransition =
          state.phase === "cooldown" &&
          willComplete &&
          state.cooldownIndex < state.cooldownTotal - 1;

        return {
          ...state,
          holdLeft: nextHold,
          isHoldRunning: nextHold > 0,
          holdCompleted: willComplete,
          cooldownTransitionLeft: shouldStartTransition
            ? COOLDOWN_TRANSITION_SECONDS
            : null,
          isCooldownTransitionPaused: false,
        };
      }

      // In rest:
      if (state.phase === "rest") {
        const nextGlobal = Math.max(0, state.globalLeft - 1);
        return {
          ...state,
          globalLeft: nextGlobal,
          globalExpired: state.globalExpired || nextGlobal === 0,
          restLeft: Math.max(0, state.restLeft - 1),
        };
      }

      // In circuit exercise:
      const nextGlobal = Math.max(0, state.globalLeft - 1);
      const isGlobalExpired = state.globalExpired || nextGlobal === 0;

      let nextHold = state.holdLeft;
      let nextIsRunning = state.isHoldRunning;
      let nextCompleted = state.holdCompleted;

      if (state.isHoldRunning && state.holdLeft != null && state.holdLeft > 0) {
        nextHold = state.holdLeft - 1;
        if (nextHold === 0) {
          nextIsRunning = false;
          nextCompleted = true;
        }
      }

      return {
        ...state,
        globalLeft: nextGlobal,
        globalExpired: isGlobalExpired,
        holdLeft: nextHold,
        isHoldRunning: nextIsRunning,
        holdCompleted: nextCompleted,
      };
    }
    case "MOVE_TO_EXERCISE":
      return {
        ...state,
        phase: "exercise",
        exerciseIndex: action.index,
        holdLeft: action.hold,
        holdTotal: action.hold,
        isHoldRunning: false,
        holdCompleted: false,
      };
    case "START_REST":
      return {
        ...state,
        phase: "rest",
        restLeft: REST_BETWEEN_ROUNDS_SECONDS,
        holdLeft: null,
        holdTotal: null,
        isHoldRunning: false,
        holdCompleted: false,
      };
    case "END_REST":
      return {
        ...state,
        phase: "exercise",
        round: state.round + 1,
        exerciseIndex: 0,
        restLeft: REST_BETWEEN_ROUNDS_SECONDS,
        holdLeft: action.hold,
        holdTotal: action.hold,
        isHoldRunning: false,
        holdCompleted: false,
      };
    case "END_WARMUP":
      return {
        ...state,
        phase: "exercise",
        round: 1,
        exerciseIndex: 0,
        holdLeft: action.hold,
        holdTotal: action.hold,
        isHoldRunning: false,
        holdCompleted: false,
      };
    case "START_COOLDOWN":
      return {
        ...state,
        phase: "cooldown",
        cooldownIndex: 0,
        holdLeft: action.hold,
        holdTotal: action.hold,
        isHoldRunning: false,
        holdCompleted: false,
        cooldownTransitionLeft: null,
        isCooldownTransitionPaused: false,
        elapsed: action.elapsed,
      };
    case "MOVE_COOLDOWN":
      return {
        ...state,
        phase: "cooldown",
        cooldownIndex: action.index,
        holdLeft: action.hold,
        holdTotal: action.hold,
        isHoldRunning: action.autoStart ?? false,
        holdCompleted: false,
        cooldownTransitionLeft: null,
        isCooldownTransitionPaused: false,
      };
    case "START_COOLDOWN_TRANSITION":
      return {
        ...state,
        cooldownTransitionLeft: COOLDOWN_TRANSITION_SECONDS,
        isCooldownTransitionPaused: false,
      };
    case "PAUSE_COOLDOWN_TRANSITION":
      return {
        ...state,
        isCooldownTransitionPaused: true,
      };
    case "RESUME_COOLDOWN_TRANSITION":
      return {
        ...state,
        isCooldownTransitionPaused: false,
      };
    case "CANCEL_COOLDOWN_TRANSITION":
      return {
        ...state,
        cooldownTransitionLeft: null,
        isCooldownTransitionPaused: false,
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

function HoldTimerBox({
  holdLeft,
  holdTotal,
  isRunning,
  isCompleted,
  label,
  onStart,
  onPause,
  onReset,
}: {
  holdLeft: number;
  holdTotal: number;
  isRunning: boolean;
  isCompleted: boolean;
  label: string;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}) {
  const percent = Math.min(
    100,
    Math.max(0, Math.round(((holdTotal - holdLeft) / holdTotal) * 100)),
  );

  return (
    <div className="surface-card rounded-2xl p-4 lg:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span
            className={`font-display text-4xl font-semibold tabular-nums lg:text-5xl ${
              isCompleted
                ? "text-accent"
                : isRunning
                  ? "text-energy"
                  : "text-foreground"
            }`}
          >
            {holdLeft}s
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            / {holdTotal}s
          </span>
        </div>

        <div>
          {isCompleted ? (
            <span className="chip inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
              <CheckCircleIcon className="h-3.5 w-3.5" />
              Concluído
            </span>
          ) : isRunning ? (
            <span className="chip-energy inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
              <span className="inline-block h-2 w-2 rounded-full bg-energy animate-pulse" />
              Contando
            </span>
          ) : holdLeft < holdTotal ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-elevated px-3 py-1 text-xs font-semibold text-muted">
              Pausado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-elevated px-3 py-1 text-xs font-semibold text-muted">
              Pronto
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-line/50">
        <div
          className={`h-full transition-all duration-300 ${
            isCompleted ? "bg-accent" : isRunning ? "bg-energy" : "bg-muted"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="mt-2.5 text-xs text-muted lg:text-sm">
        {isCompleted
          ? "Tempo concluído! Descanse alguns segundos e avance quando estiver pronto."
          : isRunning
            ? "Mantenha a postura e respire continuamente."
            : holdLeft < holdTotal
              ? "Temporizador pausado. Toque em continuar quando estiver pronto."
              : "Posicione-se e dê play quando estiver pronto para iniciar."}
      </p>

      {!isCompleted && (
        <div className="mt-3 flex items-center gap-2">
          {!isRunning ? (
            <button
              type="button"
              onClick={onStart}
              className="btn-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold shadow-sm transition-transform active:scale-[0.98]"
            >
              <PlayIcon className="h-4 w-4" />
              {holdLeft < holdTotal ? "Continuar" : label}
            </button>
          ) : (
            <button
              type="button"
              onClick={onPause}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-line bg-elevated px-5 text-sm font-semibold hover:border-foreground/30 transition-transform active:scale-[0.98]"
            >
              <PauseIcon className="h-4 w-4" />
              Pausar
            </button>
          )}

          {holdLeft < holdTotal && (
            <button
              type="button"
              onClick={onReset}
              title="Reiniciar temporizador"
              className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-xl border border-line bg-elevated px-4 text-sm font-semibold text-muted hover:text-foreground transition-transform active:scale-[0.98]"
            >
              <RotateCcwIcon className="h-4 w-4" />
              Reiniciar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CooldownTransitionBox({
  secondsLeft,
  totalSeconds,
  isPaused,
  nextExerciseName,
  nextExerciseCues,
  isNextLast,
  onStartNow,
  onTogglePause,
}: {
  secondsLeft: number;
  totalSeconds: number;
  isPaused: boolean;
  nextExerciseName: string;
  nextExerciseCues?: string | null;
  isNextLast: boolean;
  onStartNow: () => void;
  onTogglePause: () => void;
}) {
  const percent = Math.max(0, Math.min(100, (secondsLeft / totalSeconds) * 100));

  return (
    <div className="surface-card rounded-2xl p-4 lg:p-5 border-2 border-energy/40 bg-energy-soft/25 dark:bg-energy-soft/15 shadow-sm animate-fade-up">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-energy text-white font-display text-3xl font-bold tabular-nums shadow-sm animate-pulse-rest">
            {secondsLeft}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-energy">
              {isNextLast ? "Último alongamento em..." : "Próximo alongamento em..."}
            </p>
            <p className="font-display text-lg font-semibold leading-snug lg:text-xl text-foreground">
              {nextExerciseName}
            </p>
          </div>
        </div>

        <span className="chip-energy inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
          <span
            className={`inline-block h-2 w-2 rounded-full bg-energy ${
              isPaused ? "" : "animate-ping"
            }`}
          />
          {isPaused ? "Pausado" : "Transição"}
        </span>
      </div>

      <div className="mt-3.5 h-2.5 w-full overflow-hidden rounded-full bg-line/50">
        <div
          className="h-full bg-energy transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      {nextExerciseCues && (
        <p className="mt-2.5 text-xs text-muted leading-relaxed lg:text-sm">
          <strong className="text-foreground">Dica: </strong>
          {nextExerciseCues}
        </p>
      )}

      <p className="mt-2 text-xs text-muted">
        {isPaused
          ? "Contagem pausada. Posicione-se e clique em continuar ou iniciar agora."
          : "Troque de postura e prepare-se. O temporizador iniciará automaticamente."}
      </p>

      <div className="mt-3.5 flex items-center gap-2">
        <button
          type="button"
          onClick={onStartNow}
          className="btn-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold shadow-sm transition-transform active:scale-[0.98]"
        >
          <PlayIcon className="h-4 w-4" />
          Iniciar agora
        </button>

        <button
          type="button"
          onClick={onTogglePause}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-line bg-elevated px-4 text-sm font-semibold hover:border-foreground/30 transition-transform active:scale-[0.98]"
        >
          {isPaused ? <PlayIcon className="h-4 w-4" /> : <PauseIcon className="h-4 w-4" />}
          {isPaused ? "Continuar contagem" : "Pausar contagem"}
        </button>
      </div>
    </div>
  );
}

export function WorkoutSession({ workout, exercises }: Props) {
  const router = useRouter();
  const { warmup, circuit, cooldown } = useMemo(
    () => splitSession(exercises),
    [exercises],
  );
  const init = useMemo<SessionInit>(
    () => ({
      circuit,
      cooldown,
      warmupHold: warmup ? (holdFor(warmup) ?? WARMUP_SECONDS) : null,
    }),
    [circuit, cooldown, warmup],
  );
  const [state, dispatch] = useReducer(reducer, init, createInitialState);
  const startedAtRef = useRef(0);
  const circuitElapsedRef = useRef(0);
  const finishedRef = useRef(false);
  const restEndingRef = useRef(false);
  const cooldownStartedRef = useRef(false);
  const holdAlarmRef = useRef(false);
  const cooldownTransitionRef = useRef(false);

  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      stopTimerDone();
    };
  }, []);

  useEffect(() => {
    if (state.phase === "warmup" || state.phase === "cooldown") return;
    if (startedAtRef.current === 0) {
      startedAtRef.current = Date.now();
    }
  }, [state.phase]);

  const circuitElapsedSeconds = useCallback(() => {
    if (circuitElapsedRef.current > 0) return circuitElapsedRef.current;
    const start = startedAtRef.current || Date.now();
    return Math.max(1, Math.round((Date.now() - start) / 1000));
  }, []);

  const finish = useCallback(
    async (elapsedOverride?: number, opts?: { silent?: boolean }) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      if (!opts?.silent) {
        signalComplete();
      }
      const duration = elapsedOverride ?? circuitElapsedSeconds();
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
    },
    [circuitElapsedSeconds, router, workout.id],
  );

  const beginCooldownOrFinish = useCallback(() => {
    if (cooldownStartedRef.current || finishedRef.current) return;
    cooldownStartedRef.current = true;
    const elapsed = circuitElapsedSeconds();
    circuitElapsedRef.current = elapsed;
    if (cooldown.length === 0) {
      void finish(elapsed);
      return;
    }
    signalExerciseChange();
    dispatch({
      type: "START_COOLDOWN",
      hold: holdFor(cooldown[0]),
      elapsed,
    });
  }, [circuitElapsedSeconds, cooldown, finish]);

  const isDone = state.phase === "done";

  // Tick interval every 1 second
  useEffect(() => {
    if (isDone) return;
    const id = window.setInterval(() => {
      dispatch({ type: "TICK" });
    }, 1000);
    return () => window.clearInterval(id);
  }, [isDone]);

  // Video prefetching for upcoming exercises
  const prefetchUrl = useMemo(() => {
    if (state.phase === "warmup" || state.phase === "rest") {
      return circuit[0]?.exercise.video_url ?? null;
    }
    if (state.phase === "exercise") {
      const nextInRound = circuit[state.exerciseIndex + 1];
      if (nextInRound) return nextInRound.exercise.video_url ?? null;
      if (
        state.round >= CIRCUIT_ROUNDS ||
        state.globalExpired ||
        state.globalLeft === 0
      ) {
        return cooldown[0]?.exercise.video_url ?? null;
      }
      return circuit[0]?.exercise.video_url ?? null;
    }
    if (state.phase === "cooldown") {
      return cooldown[state.cooldownIndex + 1]?.exercise.video_url ?? null;
    }
    return null;
  }, [
    circuit,
    cooldown,
    state.cooldownIndex,
    state.exerciseIndex,
    state.globalExpired,
    state.globalLeft,
    state.phase,
    state.round,
  ]);

  useEffect(() => {
    if (!prefetchUrl) return;
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.src = prefetchUrl;
    video.load();
    return () => {
      video.removeAttribute("src");
      video.load();
    };
  }, [prefetchUrl]);

  // Sound alert when any hold timer finishes (warmup, exercise, cooldown)
  useEffect(() => {
    if (state.holdCompleted && !holdAlarmRef.current) {
      holdAlarmRef.current = true;
      signalTimerDone();
    }
  }, [state.holdCompleted]);

  useEffect(() => {
    if (!state.holdCompleted) {
      holdAlarmRef.current = false;
      stopTimerDone();
    }
  }, [
    state.holdCompleted,
    state.phase,
    state.exerciseIndex,
    state.cooldownIndex,
  ]);

  // Rest timer handling: when rest reaches 0, advance to next round OR cooldown if 15min is up
  useEffect(() => {
    if (state.phase === "rest" && state.restLeft === 0 && !restEndingRef.current) {
      restEndingRef.current = true;
      if (state.globalExpired || state.globalLeft === 0) {
        beginCooldownOrFinish();
      } else {
        signalExerciseChange();
        dispatch({ type: "END_REST", hold: holdFor(circuit[0]) });
      }
    }
    if (state.phase !== "rest") {
      restEndingRef.current = false;
    }
  }, [
    state.phase,
    state.restLeft,
    state.globalExpired,
    state.globalLeft,
    circuit,
    beginCooldownOrFinish,
  ]);

  const startCircuit = useCallback(() => {
    if (state.phase !== "warmup") return;
    signalExerciseChange();
    dispatch({ type: "END_WARMUP", hold: holdFor(circuit[0]) });
  }, [state.phase, circuit]);

  const advanceCooldown = useCallback(
    (autoStart = false) => {
      if (state.phase !== "cooldown") return;
      const nextIndex = state.cooldownIndex + 1;
      if (nextIndex >= cooldown.length) {
        void finish(circuitElapsedRef.current || circuitElapsedSeconds(), {
          silent: true,
        });
        return;
      }
      signalExerciseChange();
      dispatch({
        type: "MOVE_COOLDOWN",
        index: nextIndex,
        hold: holdFor(cooldown[nextIndex]),
        autoStart,
      });
    },
    [
      state.phase,
      state.cooldownIndex,
      cooldown,
      finish,
      circuitElapsedSeconds,
    ],
  );

  const togglePauseCooldownTransition = useCallback(() => {
    if (state.isCooldownTransitionPaused) {
      dispatch({ type: "RESUME_COOLDOWN_TRANSITION" });
    } else {
      dispatch({ type: "PAUSE_COOLDOWN_TRANSITION" });
    }
  }, [state.isCooldownTransitionPaused]);

  // Audio countdown ticks on 3, 2, 1 during cooldown transition
  useEffect(() => {
    if (
      state.phase === "cooldown" &&
      state.cooldownTransitionLeft != null &&
      state.cooldownTransitionLeft > 0 &&
      state.cooldownTransitionLeft <= 3 &&
      !state.isCooldownTransitionPaused
    ) {
      signalCountdownTick(state.cooldownTransitionLeft);
    }
  }, [
    state.phase,
    state.cooldownTransitionLeft,
    state.isCooldownTransitionPaused,
  ]);

  // Automatic advance to next cooldown exercise when countdown hits 0
  useEffect(() => {
    if (
      state.phase === "cooldown" &&
      state.cooldownTransitionLeft === 0 &&
      !cooldownTransitionRef.current
    ) {
      cooldownTransitionRef.current = true;
      advanceCooldown(true);
    }
    if (state.phase !== "cooldown" || state.cooldownTransitionLeft !== 0) {
      cooldownTransitionRef.current = false;
    }
  }, [state.phase, state.cooldownTransitionLeft, advanceCooldown]);

  const current = circuit[state.exerciseIndex];
  const cooldownCurrent = cooldown[state.cooldownIndex];

  const onStartHold = useCallback(() => {
    unlockAudio();
    if (startedAtRef.current === 0 && state.phase === "exercise") {
      startedAtRef.current = Date.now();
    }
    dispatch({ type: "START_HOLD" });
  }, [state.phase]);

  const onPauseHold = useCallback(() => {
    dispatch({ type: "PAUSE_HOLD" });
  }, []);

  const onResetHold = useCallback(() => {
    dispatch({ type: "RESET_HOLD" });
  }, []);

  function onNext() {
    if (state.phase !== "exercise") return;

    // If 15 min global timer has expired, finishing the current exercise moves to cooldown or finish
    if (state.globalExpired || state.globalLeft === 0) {
      beginCooldownOrFinish();
      return;
    }

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
      beginCooldownOrFinish();
      return;
    }

    signalRestStart();
    dispatch({ type: "START_REST" });
  }

  function onSkipRest() {
    if (state.phase !== "rest") return;
    if (state.globalExpired || state.globalLeft === 0) {
      beginCooldownOrFinish();
    } else {
      signalExerciseChange();
      dispatch({ type: "END_REST", hold: holdFor(circuit[0]) });
    }
  }

  const isGlobalTimeOver = state.globalExpired || state.globalLeft === 0;

  const progressLabel =
    state.phase === "warmup"
      ? "Antes do circuito"
      : state.phase === "cooldown"
        ? `Alongamento ${state.cooldownIndex + 1}/${cooldown.length}`
        : state.phase === "rest"
          ? `Descanso · volta ${state.round}/${CIRCUIT_ROUNDS}`
          : state.phase === "done"
            ? "Concluído"
            : `Volta ${state.round}/${CIRCUIT_ROUNDS} · Exercício ${state.exerciseIndex + 1}/${circuit.length}`;

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
          {state.saving ? " Salvando…" : " Sequência atualizada."}
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
          {isGlobalTimeOver ? "Ir para alongamento" : "Pular descanso"}
        </button>
      </div>
    );
  }

  if (state.phase === "warmup" && warmup) {
    const warmupMeta = `${warmup.target_seconds ?? WARMUP_SECONDS}s`;
    const targetSec = warmup.target_seconds ?? WARMUP_SECONDS;

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

            <HoldTimerBox
              holdLeft={state.holdLeft ?? targetSec}
              holdTotal={state.holdTotal ?? targetSec}
              isRunning={state.isHoldRunning}
              isCompleted={state.holdCompleted}
              label="Iniciar aquecimento"
              onStart={onStartHold}
              onPause={onPauseHold}
              onReset={onResetHold}
            />

            <p className="text-sm leading-relaxed text-muted lg:text-base">
              {warmup.exercise.cues}
            </p>
            <p className="text-sm text-muted">
              O circuito de 15 min começa depois. Você pode avançar quando terminar ou pular direto.
            </p>

            <div className="mt-4 flex flex-col gap-3 lg:mt-auto">
              {state.isHoldRunning || state.holdCompleted ? (
                <button
                  type="button"
                  onClick={startCircuit}
                  className="min-h-14 rounded-2xl btn-primary px-6 text-base font-semibold flex items-center justify-center gap-2"
                >
                  Começar circuito
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startCircuit}
                  className="min-h-12 text-sm font-semibold text-muted underline-offset-4 hover:underline"
                >
                  Pular aquecimento e começar circuito
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state.phase === "cooldown" && cooldownCurrent) {
    const targetSec = cooldownCurrent.target_seconds ?? 30;
    const meta = `${targetSec}s`;
    const isLast = state.cooldownIndex >= cooldown.length - 1;
    const nextCooldownExercise = cooldown[state.cooldownIndex + 1];
    const isNextLast = state.cooldownIndex + 1 >= cooldown.length - 1;
    const isTransitioning =
      state.cooldownTransitionLeft != null && state.cooldownTransitionLeft >= 0;

    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pb-8 pt-4 lg:max-w-3xl lg:px-8 lg:py-8">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-energy">
              Alongamento final
            </p>
            <p className="text-sm text-muted">{progressLabel}</p>
          </div>
          <div className="rounded-2xl border border-line bg-elevated px-4 py-2 text-center">
            <p className="font-display text-xl font-semibold tabular-nums text-muted">
              {formatTime(state.elapsed)}
            </p>
          </div>
        </header>

        <div className="lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start lg:gap-8">
          <ExerciseMedia
            src={
              cooldownCurrent.exercise.image_url ||
              cooldownCurrent.exercise.thumbnail_url
            }
            videoSrc={cooldownCurrent.exercise.video_url}
            alt={cooldownCurrent.exercise.name}
            priority
            className="mb-4 w-full rounded-3xl shadow-sm lg:mb-0"
          />

          <div className="flex flex-1 flex-col gap-3">
            <h1 className="font-display text-2xl font-semibold leading-tight lg:text-3xl">
              {cooldownCurrent.exercise.name}
            </h1>
            <p className="text-lg font-semibold text-accent">Meta: {meta}</p>

            {isTransitioning ? (
              <CooldownTransitionBox
                secondsLeft={state.cooldownTransitionLeft ?? COOLDOWN_TRANSITION_SECONDS}
                totalSeconds={COOLDOWN_TRANSITION_SECONDS}
                isPaused={state.isCooldownTransitionPaused}
                nextExerciseName={
                  nextCooldownExercise?.exercise.name ?? "Próximo alongamento"
                }
                nextExerciseCues={nextCooldownExercise?.exercise.cues}
                isNextLast={isNextLast}
                onStartNow={() => advanceCooldown(true)}
                onTogglePause={togglePauseCooldownTransition}
              />
            ) : (
              <HoldTimerBox
                holdLeft={state.holdLeft ?? targetSec}
                holdTotal={state.holdTotal ?? targetSec}
                isRunning={state.isHoldRunning}
                isCompleted={state.holdCompleted}
                label="Iniciar alongamento"
                onStart={onStartHold}
                onPause={onPauseHold}
                onReset={onResetHold}
              />
            )}

            {isLast && state.holdCompleted && (
              <div className="surface-card rounded-2xl p-4 lg:p-5 border border-accent/40 bg-accent-soft/30 dark:bg-accent-soft/20 animate-fade-up">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-white">
                    <CheckCircleIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-accent">
                      Alongamentos concluídos!
                    </p>
                    <p className="text-xs text-muted lg:text-sm">
                      Treino e recuperação finalizados. Clique abaixo para salvar no seu histórico.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <p className="text-sm leading-relaxed text-muted lg:text-base">
              {cooldownCurrent.exercise.cues}
            </p>
            <p className="text-sm text-muted">
              Fora do timer de 15 min. Ajuda peito, coluna e quadril após o
              circuito.
            </p>

            <div className="mt-4 flex flex-col gap-3 lg:mt-auto">
              {isTransitioning ? (
                <button
                  type="button"
                  onClick={() => advanceCooldown(true)}
                  className="min-h-14 rounded-2xl btn-primary px-6 text-base font-semibold flex items-center justify-center gap-2"
                >
                  <PlayIcon className="h-4 w-4" />
                  Iniciar próximo alongamento agora
                </button>
              ) : isLast && state.holdCompleted ? (
                <button
                  type="button"
                  onClick={() => advanceCooldown(false)}
                  className="min-h-14 rounded-2xl btn-primary px-6 text-base font-semibold flex items-center justify-center gap-2 shadow-sm hover:brightness-105 active:scale-[0.98] transition-all"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  Concluir treino
                </button>
              ) : state.isHoldRunning || state.holdCompleted ? (
                <button
                  type="button"
                  onClick={() => advanceCooldown(true)}
                  className="min-h-14 rounded-2xl btn-primary px-6 text-base font-semibold flex items-center justify-center gap-2"
                >
                  {isLast ? "Concluir treino" : "Próximo alongamento"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => advanceCooldown(false)}
                  className="min-h-12 text-sm font-semibold text-muted underline-offset-4 hover:underline"
                >
                  {isLast ? "Pular e concluir treino" : "Pular para o próximo alongamento"}
                </button>
              )}

              <ConfirmAction
                triggerLabel="Pular alongamento e salvar"
                title="Pular o alongamento?"
                description="O treino será salvo agora. O alongamento final ajuda peito, coluna e quadril."
                confirmLabel="Sim, pular e salvar"
                busyLabel="Salvando…"
                variant="caution"
                onConfirm={() =>
                  finish(circuitElapsedRef.current || circuitElapsedSeconds())
                }
              />
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

  const isTimedHold = state.holdLeft != null && current.target_seconds != null;

  const isLastExerciseInRound = state.exerciseIndex >= circuit.length - 1;
  const isLastRound = state.round >= CIRCUIT_ROUNDS;

  let nextButtonLabel = "Próximo exercício";
  if (isGlobalTimeOver || (isLastExerciseInRound && isLastRound)) {
    nextButtonLabel = cooldown.length > 0 ? "Ir para alongamento" : "Concluir treino";
  } else if (isLastExerciseInRound) {
    nextButtonLabel = "Finalizar volta";
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pb-8 pt-4 lg:max-w-3xl lg:px-8 lg:py-8">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Treino {workout.code}
          </p>
          <p className="text-sm text-muted">{progressLabel}</p>
        </div>
        <div
          className={`rounded-2xl px-4 py-2 text-center transition-colors ${
            isGlobalTimeOver
              ? "border border-energy/40 bg-energy-soft text-energy"
              : "btn-primary text-white"
          }`}
        >
          <p className="font-display text-xl font-semibold tabular-nums">
            {formatTime(state.globalLeft)}
          </p>
        </div>
      </header>

      {/* Global 15-minute time completed banner */}
      {isGlobalTimeOver && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-energy/40 bg-energy-soft/90 p-3.5 text-sm text-energy shadow-sm animate-fade-up">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-energy text-white">
            <CheckCircleIcon className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-energy">Tempo de 15 min concluído!</p>
            <p className="text-xs text-muted">
              Finalize este exercício com calma. Ao terminar, clique para ir ao alongamento.
            </p>
          </div>
        </div>
      )}

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
            <HoldTimerBox
              holdLeft={state.holdLeft ?? current.target_seconds ?? 30}
              holdTotal={state.holdTotal ?? current.target_seconds ?? 30}
              isRunning={state.isHoldRunning}
              isCompleted={state.holdCompleted}
              label="Iniciar contagem"
              onStart={onStartHold}
              onPause={onPauseHold}
              onReset={onResetHold}
            />
          )}

          <p className="text-sm leading-relaxed text-muted lg:text-base">
            {current.exercise.cues}
          </p>
          {state.error && <ErrorBanner message={state.error} />}

          <div className="mt-4 flex flex-col gap-3 lg:mt-auto">
            {isTimedHold && !state.isHoldRunning && !state.holdCompleted ? (
              <button
                type="button"
                onClick={onNext}
                className="min-h-12 text-sm font-semibold text-muted underline-offset-4 hover:underline"
              >
                {nextButtonLabel} (sem cronometrar)
              </button>
            ) : (
              <button
                type="button"
                onClick={onNext}
                className="min-h-14 rounded-2xl btn-primary px-6 text-base font-semibold flex items-center justify-center gap-2"
              >
                {nextButtonLabel}
              </button>
            )}

            <ConfirmAction
              triggerLabel="Encerrar e salvar"
              title="Encerrar o treino agora?"
              description="O progresso até aqui será salvo. Você não volta para o exercício atual."
              confirmLabel="Sim, encerrar e salvar"
              busyLabel="Salvando…"
              variant="caution"
              onConfirm={() => finish()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
