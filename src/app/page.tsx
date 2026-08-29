import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export default function HomePage() {
  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-end overflow-hidden px-6 pb-12 pt-16 lg:max-w-5xl lg:justify-center lg:px-10 lg:pb-16 lg:pt-20">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-90"
        aria-hidden
        style={{
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--fg) 55%, transparent) 0%, color-mix(in srgb, var(--bg) 35%, transparent) 42%, var(--bg) 100%), url('/hero-texture.svg') center/cover",
        }}
      />
      <div className="lg:max-w-xl">
        <p className="chip inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] animate-fade-up">
          Treino em casa
        </p>
        <p className="mt-4 font-display text-5xl font-semibold tracking-tight text-foreground animate-fade-up lg:text-6xl">
          {APP_NAME}
        </p>
        <h1 className="mt-4 max-w-[16ch] font-display text-3xl font-semibold leading-tight text-foreground animate-fade-up lg:text-4xl">
          15 minutos. Casa. Postura e força.
        </h1>
        <p className="mt-3 max-w-[34ch] text-base text-muted animate-fade-up lg:text-lg">
          Circuito A/B com guias visuais — dia sim, dia não. Cara de academia,
          ritmo de casa.
        </p>
        <div className="mt-10 flex flex-col gap-3 animate-fade-up sm:flex-row sm:items-center">
          <Link
            href="/signup"
            className="btn-primary flex min-h-14 items-center justify-center rounded-2xl px-6 text-base font-semibold sm:min-w-44"
          >
            Começar
          </Link>
          <Link
            href="/login"
            className="surface-card flex min-h-14 items-center justify-center rounded-2xl px-6 text-base font-semibold sm:min-w-44"
          >
            Já tenho conta
          </Link>
        </div>
      </div>
    </main>
  );
}
