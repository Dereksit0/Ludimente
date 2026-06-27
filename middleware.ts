import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";
import { RUTA_INICIO_POR_ROL } from "@/types/app.types";
import type { Rol } from "@/types/database.types";

// Rutas del sistema restringidas por rol. Si el rol no está en la lista,
// se redirige a su pantalla de inicio.
const RESTRICCIONES: { prefijo: string; roles: Rol[] }[] = [
  { prefijo: "/reportes", roles: ["admin", "psicologo"] },
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
    const { data: perfil } = await supabase
      .from("profiles")
      .select("role, activo")
      .eq("id", user.id)
      .single();

    // Usuario desactivado → cerrar sesión.
    if (perfil && !perfil.activo) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    const rol = (perfil?.role ?? "recepcionista") as Rol;
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
