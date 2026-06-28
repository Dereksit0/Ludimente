"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Rol } from "@/types/database.types";

async function requiereAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") {
    throw new Error("No autorizado");
  }
}

export interface UsuarioEquipo {
  id: string;
  usuario: string;
  full_name: string;
  role: Rol;
  especialidad: string | null;
  activo: boolean;
}

export async function listarUsuarios(): Promise<UsuarioEquipo[]> {
  await requiereAdmin();
  const db = createAdminClient();
  const { data } = await db
    .from("profiles")
    .select("id, usuario, full_name, role, especialidad, activo")
    .order("full_name");
  return (data ?? []) as UsuarioEquipo[];
}

export async function crearUsuario(input: {
  usuario: string;
  full_name: string;
  role: Rol;
  password: string;
  especialidad?: string;
}): Promise<{ ok?: boolean; error?: string }> {
  await requiereAdmin();
  const usuario = input.usuario.trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,}$/.test(usuario)) {
    return { error: "Usuario inválido (mín. 3, solo letras/números/._-)." };
  }
  if (input.password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const db = createAdminClient();
  const { data, error } = await db.auth.admin.createUser({
    email: `${usuario}@acceso.ludimente.mx`,
    password: input.password,
    email_confirm: true,
    app_metadata: { role: input.role, activo: true },
    user_metadata: {
      usuario,
      full_name: input.full_name,
      role: input.role,
    },
  });
  if (error || !data.user) {
    return { error: error?.message ?? "No se pudo crear el usuario." };
  }

  // El trigger handle_new_user creó el profile; afinamos especialidad.
  if (input.especialidad) {
    await db
      .from("profiles")
      .update({ especialidad: input.especialidad })
      .eq("id", data.user.id);
  }
  return { ok: true };
}

export async function cambiarActivoUsuario(
  id: string,
  activo: boolean,
): Promise<{ ok: boolean }> {
  await requiereAdmin();
  const db = createAdminClient();
  const { data } = await db.auth.admin.getUserById(id);
  const meta = data.user?.app_metadata ?? {};
  await db.auth.admin.updateUserById(id, {
    app_metadata: { ...meta, activo },
    // Banear revoca los refresh tokens: al validar contra GoTrue (getUser en el
    // middleware) el acceso se corta sin esperar a que el rol cambie en caché.
    ban_duration: activo ? "none" : "876000h",
  });
  await db.from("profiles").update({ activo }).eq("id", id);
  return { ok: true };
}

export async function cambiarRolUsuario(
  id: string,
  role: Rol,
): Promise<{ ok: boolean }> {
  await requiereAdmin();
  const db = createAdminClient();
  const { data } = await db.auth.admin.getUserById(id);
  const meta = data.user?.app_metadata ?? {};
  await db.auth.admin.updateUserById(id, {
    app_metadata: { ...meta, role },
  });
  await db.from("profiles").update({ role }).eq("id", id);
  return { ok: true };
}
