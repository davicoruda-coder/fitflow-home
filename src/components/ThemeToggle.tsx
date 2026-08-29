"use client";

import { useTheme } from "@/components/ThemeProvider";
import type { ThemeMode } from "@/lib/theme";

const options: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <section className="surface-card rounded-2xl p-4">
      <div className="mb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          Aparência
        </p>
        <h2 className="mt-1 font-display text-lg font-semibold">Tema</h2>
        <p className="mt-1 text-sm text-muted">
          Claro ou escuro — escolha o que combina com o treino.
        </p>
      </div>
      <div
        className="grid grid-cols-2 gap-2 rounded-xl border border-line bg-background/70 p-1"
        role="group"
        aria-label="Tema do app"
      >
        {options.map((option) => {
          const active = theme === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
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
    </section>
  );
}
