import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/ProfileForm";
import { ErrorBanner } from "@/components/ui";
import { getProfile, requireUser } from "@/lib/data";

export const metadata: Metadata = {
  title: "Perfil",
};

export default async function PerfilPage() {
  const { user } = await requireUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (!profile) {
    return (
      <div className="px-6 py-10">
        <ErrorBanner message="Perfil não encontrado." />
      </div>
    );
  }

  return (
    <div className="px-6 py-8 animate-fade-up">
      <h1 className="mb-6 font-display text-3xl font-semibold tracking-tight">
        Perfil
      </h1>
      <ProfileForm profile={profile} email={user.email ?? ""} />
    </div>
  );
}
