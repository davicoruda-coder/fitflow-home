import Link from "next/link";
import { AuthHeroBackground } from "@/components/AuthHeroBackground";
import { APP_NAME } from "@/lib/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="auth-screen relative mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-background px-6 lg:max-w-xl lg:justify-end lg:overflow-hidden lg:bg-transparent lg:pb-16 lg:pt-20">
      <AuthHeroBackground />

      <div className="auth-content-sheet relative z-10 flex flex-1 flex-col pb-[max(4.5rem,env(safe-area-inset-bottom,0px)+2.5rem)] lg:pb-0">
        <div className="pb-2 lg:mb-6">
          <Link href="/" className="inline-flex flex-col gap-2 no-underline lg:gap-3">
            <span className="chip-energy inline-flex w-fit rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]">
              15 min em casa
            </span>
            <span className="font-display text-4xl font-semibold tracking-tight text-foreground lg:text-6xl">
              {APP_NAME}
            </span>
          </Link>
        </div>

        <div className="mt-4 flex-1 [animation-delay:70ms] lg:mt-auto lg:animate-fade-up">
          {children}
        </div>
      </div>
    </main>
  );
}
