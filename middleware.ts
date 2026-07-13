import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";
import { RUTA_INICIO_POR_ROL } from "@/types/app.types";
import type { Rol } from "@/types/database.types";

// Rutas del sistema restringidas por rol. Si el rol no está en la lista,
// se redirige a su pantalla de inicio.
const RESTRICCIONES: { prefijo: string; roles: Rol[] }[] = [
  { prefijo: "/cobranza", roles: ["admin"] },
  { prefijo: "/finanzas", roles: ["admin"] },
  { prefijo: "/evaluaciones", roles: ["admin", "psicologo"] },
  { prefijo: "/reportes", roles: ["admin", "psicologo"] },
  { prefijo: "/consentimientos", roles: ["admin", "recepcionista"] },
  { prefijo: "/terapeutas", roles: ["admin"] },
  { prefijo: "/tamizaje", roles: ["admin", "psicologo"] },
  { prefijo: "/planes", roles: ["admin", "psicologo"] },
  { prefijo: "/progreso", roles: ["admin", "psicologo"] },
  { prefijo: "/configuracion", roles: ["admin"] },
  { prefijo: "/dashboard", roles: ["admin", "psicologo", "recepcionista"] },
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { supabaseResponse, supabase, user } = await updateSession(request);

  const esRutaPublica =
    pathname === "/login" || pathname.startsWith("/portal");

  // Sin sesión y ruta protegida → al login.
  if (!user && !esRutaPublica) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Con sesión: aplicar restricciones por rol.
  if (user && !esRutaPublica) {
    // Rol y estado se leen del token (app_metadata), sin consultar la BD.
    // Esto evita una llamada de red por cada navegación (ver migración 007).
    const meta = user.app_metadata ?? {};

    // Usuario desactivado → cerrar sesión.
    if (meta.activo === false) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    const rol = ((meta.role as Rol | undefined) ?? "recepcionista") as Rol;
    const restriccion = RESTRICCIONES.find((r) =>
      pathname.startsWith(r.prefijo),
    );

    if (restriccion && !restriccion.roles.includes(rol)) {
      const url = request.nextUrl.clone();
      url.pathname = RUTA_INICIO_POR_ROL[rol];
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Todas las rutas excepto:
     * _next/static, _next/image, favicon, assets públicos.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
