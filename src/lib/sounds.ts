function getAudioContext(): AudioContext | null {
  try {
    const g = globalThis as typeof globalThis & {
      __fitflowAudioCtx?: AudioContext;
    };
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = g.__fitflowAudioCtx ?? new Ctx();
    g.__fitflowAudioCtx = ctx;
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
    return ctx;
  } catch {
    return null;
  }
}

function beep(frequency = 880, durationMs = 120, volume = 0.08) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    const stopAt = ctx.currentTime + durationMs / 1000;
    gain.gain.exponentialRampToValueAtTime(0.0001, stopAt);
    osc.stop(stopAt);
  } catch {
    // Autoplay / unsupported — ignore
  }
}

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate?.(pattern);
  }
}

/** Unlock Web Audio on a user gesture so later timer alarms can play on iOS. */
export function unlockAudio() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
}

let timerDoneTimeouts: ReturnType<typeof setTimeout>[] = [];

export function stopTimerDone() {
  for (const id of timerDoneTimeouts) {
    clearTimeout(id);
  }
  timerDoneTimeouts = [];
}

export function signalExerciseChange() {
  stopTimerDone();
  beep(720, 90, 0.07);
  vibrate(30);
}

export function signalRestStart() {
  stopTimerDone();
  beep(440, 140, 0.07);
}

export function signalCountdownTick(secondsLeft?: number) {
  const freq = secondsLeft === 1 ? 660 : 540;
  beep(freq, 70, 0.05);
  vibrate(15);
}

export const TIMER_REPEATS_STORAGE_KEY = "fitflow-timer-repeats";
export type TimerRepeatCount = 1 | 2 | 3;
export const DEFAULT_TIMER_REPEATS: TimerRepeatCount = 3;

export function getTimerRepeats(): TimerRepeatCount {
  if (typeof window === "undefined") return DEFAULT_TIMER_REPEATS;
  try {
    const raw = localStorage.getItem(TIMER_REPEATS_STORAGE_KEY);
    const parsed = Number(raw);
    if (parsed === 1 || parsed === 2 || parsed === 3) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_TIMER_REPEATS;
}

export function setTimerRepeats(count: TimerRepeatCount): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TIMER_REPEATS_STORAGE_KEY, String(count));
  } catch {
    // ignore
  }
}

/** Hold / stretch / warmup timer reached zero — time to stop. Repeats per user setting (default 3x). */
export function signalTimerDone(repeatCount?: number, intervalMs = 900) {
  stopTimerDone();
  const count = repeatCount ?? getTimerRepeats();

  const playBurst = () => {
    beep(880, 220, 0.12);
    timerDoneTimeouts.push(setTimeout(() => beep(1175, 280, 0.14), 160));
    timerDoneTimeouts.push(setTimeout(() => beep(1319, 360, 0.12), 380));
    vibrate([80, 60, 140]);
  };

  playBurst();

  for (let i = 1; i < count; i++) {
    timerDoneTimeouts.push(
      setTimeout(() => {
        playBurst();
      }, i * intervalMs)
    );
  }
}

export function signalComplete() {
  stopTimerDone();
  beep(990, 180, 0.11);
  setTimeout(() => beep(1200, 220, 0.12), 180);
  vibrate([40, 40, 80]);
}


