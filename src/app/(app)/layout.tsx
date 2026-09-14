import { BottomNav } from "@/components/BottomNav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col lg:max-w-6xl lg:flex-row lg:items-stretch lg:gap-6 lg:px-6 lg:py-6 xl:max-w-7xl xl:gap-8 xl:px-8">
      <BottomNav />
      <div className="surface-panel relative flex min-h-dvh flex-1 flex-col lg:min-h-[calc(100dvh-3rem)] lg:overflow-y-auto lg:rounded-[1.75rem]">
        <div className="flex-1 pb-24 lg:pb-8">
          <div className="lg:px-6 xl:px-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
