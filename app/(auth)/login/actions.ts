"use server";

import { redirect } from "next/navigation";

import { usuarioAEmail } from "@/lib/auth/usuario";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validations/auth.schema";
import { RUTA_INICIO_POR_ROL } from "@/types/app.types";
import type { Rol } from "@/types/database.types";

export type LoginState = { error: string | null };

/** Traduce los errores de Supabase Auth a mensajes en español. */
function mensajeError(mensaje: string): string {
  const m = mensaje.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "Credenciales incorrectas. Verifica tu ID y contraseña.";
  if (m.includes("too many requests"))
    return "Demasiados intentos. Espera un momento e inténtalo de nuevo.";
  return "No pudimos iniciar sesión. Inténtalo de nuevo.";
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    usuario: formData.get("usuario"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Datos inválidos" };
  }

  const supabase = createClient();
  // El ID de usuario se traduce al email sintético interno de Supabase Auth.
  const { error } = await supabase.auth.signInWithPassword({
    email: usuarioAEmail(parsed.data.usuario),
    password: parsed.data.password,
  });

  if (error) {
    return { error: mensajeError(error.message) };
  }

  // Obtener el rol para redirigir a la pantalla de inicio adecuada.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let destino = "/dashboard";
  if (user) {
    const { data: perfil } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (perfil) {
      destino = RUTA_INICIO_POR_ROL[perfil.role as Rol] ?? "/dashboard";
    }
  }

  redirect(destino);
}

export async function logoutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
