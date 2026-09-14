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

export function signalExerciseChange() {
  beep(720, 90, 0.07);
  vibrate(30);
}

export function signalRestStart() {
  beep(440, 140, 0.07);
}

/** Hold / stretch / warmup timer reached zero — time to stop. */
export function signalTimerDone() {
  beep(880, 220, 0.12);
  setTimeout(() => beep(1175, 280, 0.14), 160);
  setTimeout(() => beep(1319, 360, 0.12), 380);
  vibrate([80, 60, 140]);
}

export function signalComplete() {
  beep(990, 180, 0.11);
  setTimeout(() => beep(1200, 220, 0.12), 180);
  vibrate([40, 40, 80]);
}
