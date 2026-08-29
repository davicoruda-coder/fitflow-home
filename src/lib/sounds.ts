function beep(frequency = 880, durationMs = 120) {
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
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = frequency;
    gain.gain.value = 0.07;
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

export function signalExerciseChange() {
  beep(720, 90);
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate?.(30);
  }
}

export function signalRestStart() {
  beep(440, 140);
}

export function signalComplete() {
  beep(990, 160);
  setTimeout(() => beep(1200, 160), 180);
}
