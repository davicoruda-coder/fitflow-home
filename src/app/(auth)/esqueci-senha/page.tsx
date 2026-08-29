import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Esqueci a senha",
};

export default function EsqueciSenhaPage() {
  return (
    <div>
      <h1 className="sr-only">Esqueci a senha</h1>
      <p className="mb-6 text-sm text-muted">
        Envie o link e volte a treinar.
      </p>
      <ForgotPasswordForm />
    </div>
  );
}
