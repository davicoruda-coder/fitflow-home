"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME } from "@/lib/constants";

const links = [
  { href: "/hoje", label: "Hoje" },
  { href: "/historico", label: "Histórico" },
  { href: "/perfil", label: "Perfil" },
];

function NavLinks({
  orientation,
}: {
  orientation: "horizontal" | "vertical";
}) {
  const pathname = usePathname();
  const vertical = orientation === "vertical";

  return (
    <ul
      className={
        vertical
          ? "flex flex-col gap-1.5"
          : "mx-auto flex w-full max-w-lg items-stretch justify-around px-2 py-2"
      }
    >
      {links.map((link) => {
        const active =
          pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <li key={link.href} className={vertical ? undefined : "flex-1"}>
            <Link
              href={link.href}
              prefetch
              className={
                vertical
                  ? `flex min-h-12 items-center rounded-2xl px-4 text-base font-semibold tracking-wide transition ${
                      active
                        ? "chip"
                        : "text-muted hover:bg-accent-soft/40 hover:text-foreground"
                    }`
                  : `flex min-h-12 items-center justify-center rounded-xl text-sm font-semibold tracking-wide transition ${
                      active
                        ? "chip"
                        : "text-muted hover:bg-accent-soft/40 hover:text-foreground"
                    }`
              }
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/treino")) {
    return null;
  }

  return (
    <>
      {/* Desktop: side rail — solid bg, no blur (faster paint) */}
      <aside className="hidden w-56 shrink-0 flex-col justify-between rounded-[1.75rem] border border-line bg-elevated p-5 lg:flex xl:w-60">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            App
          </p>
          <p className="mt-2 font-display text-2xl font-semibold tracking-tight">
            {APP_NAME}
          </p>
          <nav className="mt-8" aria-label="Navegação principal">
            <NavLinks orientation="vertical" />
          </nav>
        </div>
        <p className="text-xs leading-relaxed text-muted">
          Circuito em casa · 15 min
        </p>
      </aside>

      {/* Mobile: bottom bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-elevated/95 lg:hidden"
        style={{ paddingBottom: "var(--safe-bottom)" }}
        aria-label="Navegação principal"
      >
        <NavLinks orientation="horizontal" />
      </nav>
    </>
  );
}
