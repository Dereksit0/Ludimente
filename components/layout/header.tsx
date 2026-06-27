"use client";

import { usePathname } from "next/navigation";

import { Search } from "lucide-react";

import { NAV_ITEMS } from "./nav-config";

/** Deriva un título legible a partir del pathname. */
function tituloDeRuta(pathname: string): string {
  const item = NAV_ITEMS.find(
    (i) => pathname === i.href || pathname.startsWith(`${i.href}/`),
  );
  if (item) return item.label;
  if (pathname.startsWith("/agenda/recordatorios")) return "Recordatorios";
  return "Ludimente";
}

export function Header() {
  const pathname = usePathname();
  const titulo = tituloDeRuta(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-luda-lila/15 bg-luda-blanco/80 px-4 backdrop-blur md:px-8">
      <h1 className="font-fredoka text-xl text-luda-gris md:hidden">
        🐙 {titulo}
      </h1>
      <nav aria-label="Migas de pan" className="hidden text-sm md:block">
        <span className="font-semibold text-luda-gris-light">Ludimente</span>
        <span className="mx-2 text-luda-gris-light">/</span>
        <span className="font-bold text-luda-gris">{titulo}</span>
      </nav>

      {/* Buscador global (Cmd+K llega en Fase 7) */}
      <button
        type="button"
        className="flex items-center gap-2 rounded-xl border border-luda-lila/30 bg-white px-3 py-2 text-sm text-luda-gris-light transition-colors hover:border-luda-lila"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Buscar…</span>
        <kbd className="ml-2 hidden rounded border border-luda-lila/30 px-1.5 text-xs sm:inline">
          ⌘K
        </kbd>
      </button>
    </header>
  );
}
