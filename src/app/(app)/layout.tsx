import { BottomNav } from "@/components/BottomNav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col lg:max-w-5xl lg:px-8 lg:py-8">
      <div className="surface-panel relative flex min-h-dvh flex-1 flex-col lg:min-h-[calc(100dvh-4rem)] lg:overflow-hidden lg:rounded-[1.75rem]">
        <div className="flex-1 pb-24 lg:pb-28">
          <div className="lg:px-4">{children}</div>
        </div>
        <BottomNav />
      </div>
    </div>
  );
}
