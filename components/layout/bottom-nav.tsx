"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogOut, MoreHorizontal } from "lucide-react";

import { logoutAction } from "@/app/(auth)/login/actions";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import type { Perfil } from "@/types/app.types";

import { navParaRol } from "./nav-config";

/** Barra de navegación inferior para mobile (< 768px). */
export function BottomNav({ perfil }: { perfil: Pick<Perfil, "role"> }) {
  const pathname = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const items = navParaRol(perfil.role);
  const principales = items.filter((i) => i.mobile).slice(0, 3);
  // Todo lo que no cabe en la barra inferior va al menú "Más".
  const resto = items.filter((i) => !principales.includes(i));

  const masActivo = resto.some(
    (i) => pathname === i.href || pathname.startsWith(`${i.href}/`),
  );

  return (
    <>
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
        <button
          type="button"
          onClick={() => setMenuAbierto(true)}
          className={cn(
            "flex flex-col items-center gap-0.5 text-xs font-semibold",
            masActivo ? "text-luda-lila-dark" : "text-luda-gris-light",
          )}
        >
          <MoreHorizontal className="h-5 w-5" />
          Más
        </button>
      </nav>

      <Modal
        abierto={menuAbierto}
        onCerrar={() => setMenuAbierto(false)}
        titulo="Menú"
      >
        <div className="space-y-1">
          {resto.map((item) => {
            const activo =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuAbierto(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors",
                  activo
                    ? "bg-luda-lila text-white shadow-luda"
                    : "text-luda-gris hover:bg-luda-lila-light",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}

          <form action={logoutAction} className="pt-1">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
              Cerrar sesión
            </button>
          </form>
        </div>
      </Modal>
    </>
  );
}
