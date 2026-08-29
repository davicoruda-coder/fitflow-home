"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/lib/actions";
import { ErrorBanner } from "@/components/ui";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { SCHEDULE_MODES, WEEKDAY_OPTIONS } from "@/lib/day-plan";
import { DISPLAY_NAME_MAX } from "@/lib/validation";
import type { Profile, ScheduleMode } from "@/lib/types";

type Props = {
  profile: Profile;
  email: string;
};

export function ProfileForm({ profile, email }: Props) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [startDate, setStartDate] = useState(profile.start_date);
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>(
    profile.schedule_mode,
  );
  const [weekdays, setWeekdays] = useState<number[]>(profile.schedule_weekdays);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function toggleWeekday(value: number) {
    setWeekdays((current) =>
      current.includes(value)
        ? current.filter((d) => d !== value)
        : [...current, value],
    );
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const result = await updateProfile({
      displayName,
      startDate,
      scheduleMode,
      scheduleWeekdays: weekdays,
    });

    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("Perfil atualizado.");
    router.refresh();
  }

  async function onLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <ThemeToggle />

      <form
        onSubmit={onSave}
        className="surface-card flex flex-col gap-4 rounded-2xl p-4"
      >
        {error && <ErrorBanner message={error} />}
        {message && (
          <p className="rounded-xl bg-accent-soft px-4 py-3 text-sm text-accent">
            {message}
          </p>
        )}
        <label className="flex flex-col gap-2 text-sm font-medium">
          E-mail
          <input
            value={email}
            disabled
            className="min-h-12 rounded-xl border border-line bg-background/80 px-4 text-muted"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          Nome
          <input
            value={displayName}
            maxLength={DISPLAY_NAME_MAX}
            onChange={(e) => setDisplayName(e.target.value)}
            className="min-h-12 rounded-xl border border-line bg-elevated px-4"
          />
        </label>
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">Como você treina?</legend>
          <div className="flex flex-col gap-2">
            {SCHEDULE_MODES.map((mode) => (
              <label
                key={mode.value}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-elevated px-3 py-3"
              >
                <input
                  type="radio"
                  name="scheduleMode"
                  value={mode.value}
                  checked={scheduleMode === mode.value}
                  onChange={() => setScheduleMode(mode.value)}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-semibold">{mode.label}</span>
                  <span className="block text-xs font-normal text-muted">
                    {mode.hint}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        {scheduleMode === "weekdays" && (
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">Dias da semana</legend>
            <div className="flex flex-wrap gap-2">
              {WEEKDAY_OPTIONS.map((day) => {
                const on = weekdays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleWeekday(day.value)}
                    className={`min-h-11 rounded-full px-3.5 text-sm font-semibold ${
                      on
                        ? "bg-accent text-on-accent"
                        : "border border-line bg-elevated text-muted"
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
            <span className="text-xs font-normal text-muted">
              Nos outros dias a tela Hoje mostra descanso — você ainda pode
              treinar se quiser.
            </span>
          </fieldset>
        )}
        <label className="flex flex-col gap-2 text-sm font-medium">
          Início do ciclo
          <input
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="min-h-12 rounded-xl border border-line bg-elevated px-4"
          />
          <span className="text-xs font-normal text-muted">
            Define o dia 0 (Treino A). Máximo: 1 ano atrás.
          </span>
        </label>
        <button
          type="submit"
          disabled={saving}
          className="btn-primary min-h-14 rounded-2xl px-6 font-semibold disabled:opacity-60"
        >
          {saving ? "Salvando…" : "Salvar"}
        </button>
      </form>

      <ChangePasswordForm email={email} />

      <button
        type="button"
        onClick={onLogout}
        className="min-h-14 rounded-2xl border border-danger/35 bg-elevated px-6 font-semibold text-danger"
      >
        Sair
      </button>
    </div>
  );
}
