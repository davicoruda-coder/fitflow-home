import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Descanso",
};

export default function DescansoPage() {
  return (
    <div className="px-6 py-8 animate-fade-up lg:mx-auto lg:max-w-2xl lg:px-0 lg:py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-energy">
        Descanso ativo
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight lg:text-4xl">
        Caminhada leve
      </h1>
      <div className="surface-card mt-6 rounded-3xl p-5 lg:p-7">
        <p className="text-base leading-relaxed text-muted">
          Sem cronômetro de circuito hoje. Uma caminhada de 15–20 minutos em
          ritmo conversacional ajuda recuperação e consistência — sem
          sobrecarregar peito, ombros ou core.
        </p>
        <ul className="mt-5 space-y-3 text-sm text-foreground">
          <li className="flex gap-3">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-energy" />
            Mantenha postura ereta e ombros relaxados
          </li>
          <li className="flex gap-3">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-energy" />
            Respire pelo nariz quando possível
          </li>
          <li className="flex gap-3">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-energy" />
            Hidrate e durma bem — o próximo treino conta
          </li>
        </ul>
      </div>
      <Link
        href="/hoje"
        className="btn-primary mt-10 flex min-h-14 items-center justify-center rounded-2xl px-6 font-semibold lg:max-w-xs"
      >
        Voltar para Hoje
      </Link>
    </div>
  );
}
