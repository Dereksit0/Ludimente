import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Estrella, LudiMascota } from "@/components/ui/ludi-mascota";
import { leerSesionPortal } from "@/lib/portal/session";

import { PortalLoginForm } from "./portal-login-form";

export const metadata: Metadata = { title: "Portal de Padres · Ludimente" };

export default function PortalLoginPage() {
  if (leerSesionPortal()) redirect("/portal/inicio");

  return (
    <main className="grid min-h-screen grid-cols-1 bg-luda-fondo lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 sm:p-10">
        <PortalLoginForm />
      </div>

      <aside className="relative hidden items-center justify-center overflow-hidden bg-gradient-to-br from-luda-lila to-luda-lila-dark lg:flex">
        <Estrella className="absolute left-10 top-16 h-6 w-6 text-luda-amarillo" />
        <Estrella className="absolute right-16 top-24 h-4 w-4 text-luda-amarillo-light [animation-delay:0.6s]" />
        <Estrella className="absolute bottom-24 left-20 h-5 w-5 text-luda-rosa-light [animation-delay:1.2s]" />

        <div className="relative z-10 max-w-sm text-center text-white">
          <div className="mx-auto w-48 drop-shadow-xl">
            <LudiMascota />
          </div>
          <h2 className="mt-6 font-fredoka text-3xl">Portal de Padres</h2>
          <p className="mt-2 text-lg font-semibold text-luda-lila-light">
            Sigue el avance de tu pequeño/a
          </p>
          <p className="mt-4 text-sm text-white/80">
            Consulta avances, citas, documentos y pagos.
          </p>
        </div>
      </aside>
    </main>
  );
}
