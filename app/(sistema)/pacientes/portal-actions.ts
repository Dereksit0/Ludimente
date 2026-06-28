"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Rol } from "@/types/database.types";

/** Solo el equipo clínico (admin/terapeuta) gestiona accesos del portal. */
async function requiereStaff() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const rol = user?.app_metadata?.role as Rol | undefined;
  if (!user || (rol !== "admin" && rol !== "psicologo")) {
    throw new Error("No autorizado");
  }
  return { id: user.id, esAdmin: rol === "admin" };
}

/** El admin accede a todos; un terapeuta solo a sus pacientes. */
async function requierePaciente(pacienteId: string) {
  const { id, esAdmin } = await requiereStaff();
  if (esAdmin) return;
  const db = createAdminClient();
  const { data } = await db
    .from("pacientes")
    .select("id")
    .eq("id", pacienteId)
    .or(`psicologo_asignado_id.eq.${id},created_by.eq.${id}`)
    .maybeSingle();
  if (!data) throw new Error("No autorizado para este paciente");
}

export interface AccesoPortal {
  id: string;
  tutor_id: string;
  codigo_acceso: string;
  activo: boolean;
  ultimo_acceso: string | null;
}

export async function listarAccesosPortal(
  pacienteId: string,
): Promise<AccesoPortal[]> {
  await requierePaciente(pacienteId);
  const db = createAdminClient();
  const { data } = await db
    .from("portal_accesos")
    .select("id, tutor_id, codigo_acceso, activo, ultimo_acceso")
    .eq("paciente_id", pacienteId);
  return data ?? [];
}

export async function generarAccesoPortal(input: {
  tutorId: string;
  pacienteId: string;
  pin: string;
}): Promise<{ codigo?: string; error?: string }> {
  await requierePaciente(input.pacienteId);
  const pin = input.pin.trim();
  if (!/^\d{4,6}$/.test(pin)) {
    return { error: "El PIN debe tener entre 4 y 6 dígitos." };
  }
  const db = createAdminClient();
  const { data, error } = await db.rpc("portal_generar_acceso", {
    p_tutor_id: input.tutorId,
    p_paciente_id: input.pacienteId,
    p_pin: pin,
  });
  if (error) return { error: "No se pudo generar el acceso." };
  return { codigo: data as string };
}

export async function revocarAccesoPortal(
  accesoId: string,
): Promise<{ ok: boolean }> {
  await requiereStaff();
  const db = createAdminClient();
  const { data: acceso } = await db
    .from("portal_accesos")
    .select("paciente_id")
    .eq("id", accesoId)
    .maybeSingle();
  if (acceso) await requierePaciente(acceso.paciente_id);
  await db.from("portal_accesos").delete().eq("id", accesoId);
  return { ok: true };
}
