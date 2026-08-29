import { Skeleton } from "@/components/ui";

export default function AppLoading() {
  return (
    <div className="space-y-4 px-6 py-8">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-12 w-64" />
      <Skeleton className="mt-6 h-40 w-full" />
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}
