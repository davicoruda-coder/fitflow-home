import type { Metadata } from "next";
import { SignupForm } from "@/components/SignupForm";

export const metadata: Metadata = {
  title: "Criar conta",
};

export default function SignupPage() {
  return (
    <div>
      <h1 className="sr-only">Criar conta</h1>
      <p className="mb-6 text-sm text-muted">
        Dia 0 = Treino A. Amanhã, descanso.
      </p>
      <SignupForm />
    </div>
  );
}
