import Link from "next/link";

type Props = {
  firstTime?: boolean;
};

export function MetricsReminderBanner({ firstTime = false }: Props) {
  return (
    <Link
      href="/historico"
      className="chip mt-6 flex items-center justify-between gap-3 rounded-2xl px-4 py-3 transition hover:brightness-105"
    >
      <div>
        <p className="text-sm font-semibold">
          {firstTime
            ? "Registre altura e peso"
            : "Hora de atualizar suas medidas"}
        </p>
        <p className="mt-0.5 text-xs opacity-80">
          Acompanhe sua evolução no Histórico
        </p>
      </div>
      <span className="shrink-0 text-sm font-semibold">→</span>
    </Link>
  );
}
