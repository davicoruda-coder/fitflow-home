import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Redefinir senha",
};

export default function RedefinirSenhaPage() {
  return (
    <div>
      <h1 className="sr-only">Nova senha</h1>
      <p className="mb-6 text-sm text-muted">Defina a senha e siga o circuito.</p>
      <ResetPasswordForm />
    </div>
  );
}
