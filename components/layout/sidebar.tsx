"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogOut } from "lucide-react";

import { logoutAction } from "@/app/(auth)/login/actions";
import { LudaAvatar } from "@/components/ui/luda-avatar";
import { Estrella, LudiMascota } from "@/components/ui/ludi-mascota";
import { cn } from "@/lib/utils";
import { ROL_LABEL } from "@/types/app.types";
import type { Perfil } from "@/types/app.types";

import { navParaRol } from "./nav-config";

interface SidebarProps {
  perfil: Pick<Perfil, "full_name" | "role" | "avatar_url">;
}

export function Sidebar({ perfil }: SidebarProps) {
  const pathname = usePathname();
  const items = navParaRol(perfil.role);

  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-luda-lila/15 bg-luda-fondo md:flex">
      {/* Logo */}
      <div className="relative px-6 py-6">
        <Estrella className="absolute right-6 top-5 h-3.5 w-3.5 text-luda-amarillo" />
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-fredoka text-2xl text-luda-lila-dark"
        >
          <LudiMascota className="h-9 w-9 shrink-0" /> Ludimente
        </Link>
        <p className="mt-0.5 text-xs font-semibold text-luda-gris-light">
          Donde aprender es jugar
        </p>
      </div>

      {/* Navegación */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {items.map((item) => {
          const activo =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
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
      </nav>

      {/* Footer: usuario */}
      <div className="border-t border-luda-lila/15 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <LudaAvatar nombre={perfil.full_name} foto={perfil.avatar_url} size={38} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-luda-gris">
              {perfil.full_name}
            </p>
            <p className="text-xs text-luda-gris-light">
              {ROL_LABEL[perfil.role]}
            </p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              aria-label="Cerrar sesión"
              className="rounded-lg p-2 text-luda-gris-light transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
