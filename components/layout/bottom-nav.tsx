"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Perfil } from "@/types/app.types";

import { navParaRol } from "./nav-config";

/** Barra de navegación inferior para mobile (< 768px). */
export function BottomNav({ perfil }: { perfil: Pick<Perfil, "role"> }) {
  const pathname = usePathname();
  const principales = navParaRol(perfil.role)
    .filter((i) => i.mobile)
    .slice(0, 3);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t border-luda-lila/15 bg-luda-blanco/95 backdrop-blur md:hidden">
      {principales.map((item) => {
        const activo =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 text-xs font-semibold",
              activo ? "text-luda-lila-dark" : "text-luda-gris-light",
            )}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
      <Link
        href="/configuracion"
        className="flex flex-col items-center gap-0.5 text-xs font-semibold text-luda-gris-light"
      >
        <MoreHorizontal className="h-5 w-5" />
        Más
      </Link>
    </nav>
  );
}
