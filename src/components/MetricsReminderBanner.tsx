import Link from "next/link";

type Props = {
  firstTime?: boolean;
};

/** Secondary nudge — keep below the day's primary decision on /hoje. */
export function MetricsReminderBanner({ firstTime = false }: Props) {
  return (
    <Link
      href="/historico"
      className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-elevated/80 px-4 py-3 text-muted transition hover:border-accent/35 hover:text-accent"
    >
      <div>
        <p className="text-sm font-semibold text-foreground">
          {firstTime
            ? "Registre altura e peso"
            : "Hora de atualizar suas medidas"}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          Acompanhe sua evolução no Histórico
        </p>
      </div>
      <span className="shrink-0 text-sm font-semibold" aria-hidden>
        →
      </span>
    </Link>
  );
}
