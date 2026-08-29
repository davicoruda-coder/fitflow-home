import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BodyMetricsSection } from "@/components/BodyMetricsSection";
import { ResetDataButton } from "@/components/ResetDataButton";
import { EmptyState, ErrorBanner } from "@/components/ui";
import { getBodyMetrics, getProfile, getWorkoutLogs, requireUser } from "@/lib/data";
import { toScheduleConfig } from "@/lib/day-plan";
import { calculateStreak } from "@/lib/streak";

export const metadata: Metadata = {
  title: "Histórico",
};

export default async function HistoricoPage() {
  const { user } = await requireUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  const logs = await getWorkoutLogs(user.id);
  const metrics = await getBodyMetrics(user.id);

  if (!profile) {
    return (
      <div className="px-6 py-10">
        <ErrorBanner message="Perfil não encontrado." />
      </div>
    );
  }

  const streak = calculateStreak(
    toScheduleConfig(profile),
    logs.map((l) => l.completed_at),
  );

  return (
    <div className="px-6 py-8 animate-fade-up">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Histórico
      </h1>
      <p className="mt-2 text-muted">
        Ofensiva atual:{" "}
        <span className="font-semibold text-accent">{streak}</span>
      </p>

      <BodyMetricsSection metrics={metrics} />

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Treinos</h2>
        <div className="mt-4">
          {logs.length === 0 ? (
            <EmptyState
              title="Nenhum treino ainda"
              description="Conclua seu primeiro circuito de 15 minutos para ver o histórico aqui."
            />
          ) : (
            <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {logs.map((log) => {
                const date = new Date(log.completed_at);
                const minutes = Math.round(log.duration_seconds / 60);
                return (
                  <li
                    key={log.id}
                    className="surface-card rounded-2xl px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          Treino {log.workout?.code ?? "—"}
                        </p>
                        <p className="text-sm text-muted">
                          {date.toLocaleDateString("pt-BR", {
                            weekday: "short",
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-accent">
                        ~{minutes} min
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <ResetDataButton />
    </div>
  );
}
