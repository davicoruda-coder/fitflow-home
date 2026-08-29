import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { WorkoutSession } from "@/components/WorkoutSession";
import { ErrorBanner } from "@/components/ui";
import {
  getWorkoutByCode,
  getWorkoutExercises,
  requireUser,
} from "@/lib/data";
import { splitWarmup } from "@/lib/workout";
import type { WorkoutCode } from "@/lib/types";

type Props = {
  params: Promise<{ code: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  return { title: `Treino ${code.toUpperCase()}` };
}

export default async function TreinoPage({ params }: Props) {
  const { user } = await requireUser();
  if (!user) redirect("/login");

  const { code: raw } = await params;
  const code = raw.toUpperCase();
  if (code !== "A" && code !== "B") notFound();

  const workout = await getWorkoutByCode(code as WorkoutCode);
  if (!workout) {
    return (
      <div className="px-6 py-10">
        <ErrorBanner message="Treino não encontrado no banco." />
      </div>
    );
  }

  const exercises = await getWorkoutExercises(workout.id);
  const { circuit } = splitWarmup(exercises);
  if (circuit.length === 0) {
    return (
      <div className="px-6 py-10">
        <ErrorBanner message="Este treino ainda não tem exercícios. Rode o seed SQL." />
      </div>
    );
  }

  return <WorkoutSession workout={workout} exercises={exercises} />;
}
