import type { Metadata } from "next";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Entrar",
};

export default function LoginPage() {
  return (
    <div>
      <h1 className="sr-only">Entrar</h1>
      <p className="mb-6 text-sm text-muted">Volte ao seu circuito.</p>
      <LoginForm />
    </div>
  );
}
