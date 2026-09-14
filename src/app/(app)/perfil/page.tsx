import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/ProfileForm";
import { ErrorBanner } from "@/components/ui";
import { formatEvolutionSummary } from "@/lib/body-metrics";
import { getBodyMetrics, getProfile, requireUser } from "@/lib/data";

export const metadata: Metadata = {
  title: "Perfil",
};

export default async function PerfilPage() {
  const { user } = await requireUser();
  if (!user) redirect("/login");

  const [profile, metrics] = await Promise.all([
    getProfile(user.id),
    getBodyMetrics(user.id),
  ]);

  if (!profile) {
    return (
      <div className="px-6 py-10">
        <ErrorBanner message="Perfil não encontrado." />
      </div>
    );
  }

  const evolutionSummary = metrics ? formatEvolutionSummary(metrics) : null;
  const askForMetrics = metrics !== null && metrics.length === 0;

  return (
    <div className="px-6 py-8 animate-fade-up lg:px-0 lg:py-10">
      <h1 className="mb-6 font-display text-3xl font-semibold tracking-tight lg:text-4xl">
        Perfil
      </h1>

      <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-3xl">
        {evolutionSummary ? (
          <Link
            href="/historico"
            className="surface-card mb-6 flex items-center justify-between gap-3 rounded-2xl px-4 py-3 transition hover:brightness-[1.02]"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                Evolução
              </p>
              <p className="mt-1 text-sm font-semibold">{evolutionSummary}</p>
            </div>
            <span className="shrink-0 text-sm font-semibold text-muted">→</span>
          </Link>
        ) : askForMetrics ? (
          <Link
            href="/historico"
            className="chip mb-6 flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
          >
            <div>
              <p className="text-sm font-semibold">Registre altura e peso</p>
              <p className="mt-0.5 text-xs opacity-80">
                Em 30 dias dá para ver a tendência
              </p>
            </div>
            <span className="shrink-0 text-sm font-semibold">→</span>
          </Link>
        ) : null}

        <ProfileForm profile={profile} email={user.email ?? ""} />
      </div>
    </div>
  );
}
