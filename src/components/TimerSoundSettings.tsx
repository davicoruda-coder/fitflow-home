"use client";

import { useEffect, useRef, useState } from "react";
import {
  DEFAULT_TIMER_REPEATS,
  getTimerRepeats,
  setTimerRepeats,
  signalTimerDone,
  stopTimerDone,
  unlockAudio,
  type TimerRepeatCount,
} from "@/lib/sounds";

const options: { value: TimerRepeatCount; label: string }[] = [
  { value: 1, label: "1x" },
  { value: 2, label: "2x" },
  { value: 3, label: "3x" },
];

export function TimerSoundSettings() {
  const [repeats, setRepeatsState] = useState<TimerRepeatCount>(DEFAULT_TIMER_REPEATS);
  const [isPlaying, setIsPlaying] = useState(false);
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setRepeatsState(getTimerRepeats());
    return () => {
      stopTimerDone();
      if (stopTimeoutRef.current) {
        clearTimeout(stopTimeoutRef.current);
      }
    };
  }, []);

  function handleSelect(val: TimerRepeatCount) {
    setRepeatsState(val);
    setTimerRepeats(val);
    if (isPlaying) {
      stopTimerDone();
      if (stopTimeoutRef.current) {
        clearTimeout(stopTimeoutRef.current);
      }
      setIsPlaying(false);
    }
  }

  function handleTestSound() {
    unlockAudio();
    setIsPlaying(true);
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
    }

    signalTimerDone(repeats);

    // Each burst is ~740ms, interval is 900ms
    const totalDuration = (repeats - 1) * 900 + 740;
    stopTimeoutRef.current = setTimeout(() => {
      setIsPlaying(false);
    }, totalDuration);
  }

  function handleStopSound() {
    stopTimerDone();
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
    }
    setIsPlaying(false);
  }

  return (
    <section className="surface-card rounded-2xl p-4">
      <div className="mb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          Áudio & Treino
        </p>
        <h2 className="mt-1 font-display text-lg font-semibold">
          Alarme do temporizador
        </h2>
        <p className="mt-1 text-sm text-muted">
          Quantas vezes o som toca ao concluir exercícios com tempo (prancha, isometria, etc).
        </p>
      </div>

      <div
        className="grid grid-cols-3 gap-2 rounded-xl border border-line bg-background/70 p-1"
        role="group"
        aria-label="Repetições do alarme do temporizador"
      >
        {options.map((option) => {
          const active = repeats === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`min-h-11 rounded-lg text-sm font-semibold transition ${
                active
                  ? "btn-primary"
                  : "text-muted hover:text-foreground"
              }`}
              aria-pressed={active}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between pt-1">
        <span className="text-xs text-muted">
          {repeats === 1
            ? "1 toque — ideal para quem treina com fone."
            : repeats === 2
            ? "2 toques — equilibrado para celular por perto."
            : "3 toques — recomendado para celular no chão ou som ambiente."}
        </span>
        <button
          type="button"
          onClick={isPlaying ? handleStopSound : handleTestSound}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-elevated px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-background/80"
        >
          {isPlaying ? (
            <>
              <span className="inline-block h-2 w-2 animate-ping rounded-full bg-accent" />
              Parar
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-3.5 w-3.5 text-accent"
              >
                <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.5A2.25 2.25 0 0 0 2.25 9.75v4.5A2.25 2.25 0 0 0 4.5 16.5h1.94l4.5 4.5c.944.945 2.56.276 2.56-1.06V4.06ZM18.584 5.106a.75.75 0 0 1 1.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 0 1-1.06-1.06 8.25 8.25 0 0 0 0-11.668.75.75 0 0 1 0-1.06Z" />
                <path d="M15.932 7.757a.75.75 0 0 1 1.061 0 6 6 0 0 1 0 8.486.75.75 0 0 1-1.06-1.061 4.5 4.5 0 0 0 0-6.364.75.75 0 0 1 0-1.06Z" />
              </svg>
              Testar som
            </>
          )}
        </button>
      </div>
    </section>
  );
}
