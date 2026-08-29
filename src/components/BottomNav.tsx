"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/hoje", label: "Hoje" },
  { href: "/historico", label: "Histórico" },
  { href: "/perfil", label: "Perfil" },
];

export function BottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/treino")) {
    return null;
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-elevated/95 lg:absolute lg:inset-x-0 lg:bg-elevated/90 lg:backdrop-blur-md"
      style={{ paddingBottom: "var(--safe-bottom)" }}
      aria-label="Navegação principal"
    >
      <ul className="mx-auto flex w-full max-w-lg items-stretch justify-around px-2 py-2 lg:max-w-none lg:px-6 lg:py-3">
        {links.map((link) => {
          const active =
            pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <li key={link.href} className="flex-1">
              <Link
                href={link.href}
                className={`flex min-h-12 items-center justify-center rounded-xl text-sm font-semibold tracking-wide transition lg:min-h-14 lg:text-base ${
                  active
                    ? "chip"
                    : "text-muted hover:bg-accent-soft/40 hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
