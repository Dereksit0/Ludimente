"use server";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  cerrarSesionPortal,
  crearSesionPortal,
  leerSesionPortal,
} from "@/lib/portal/session";

export type PortalLoginState = { error: string | null };

export async function portalLoginAction(
  _prev: PortalLoginState,
  formData: FormData,
): Promise<PortalLoginState> {
  const codigo = String(formData.get("codigo") ?? "").trim();
  const pin = String(formData.get("pin") ?? "").trim();

  if (!codigo || !pin) {
    return { error: "Escribe tu código y tu PIN." };
  }

  const db = createAdminClient();
  const { data, error } = await db.rpc("portal_login", {
    p_codigo: codigo,
    p_pin: pin,
  });

  if (error) {
    return { error: "No pudimos validar el acceso. Inténtalo de nuevo." };
  }

  const sesion = Array.isArray(data) ? data[0] : null;
  if (!sesion) {
    return { error: "Código o PIN incorrectos." };
  }

  crearSesionPortal({
    aid: sesion.acceso_id,
    pid: sesion.pac_id,
    pac: sesion.pac_nombre,
    tut: sesion.tut_nombre,
  });

  redirect("/portal/inicio");
}

export async function portalLogoutAction() {
  cerrarSesionPortal();
  redirect("/portal");
}

async function avisarStaff(titulo: string, mensaje: string) {
  const db = createAdminClient();
  await db.from("notificaciones").insert([
    { rol: "admin", titulo, mensaje, tipo: "solicitud", enlace: "/agenda" },
    { rol: "recepcionista", titulo, mensaje, tipo: "solicitud", enlace: "/agenda" },
  ]);
}

/** El padre confirma una cita programada de su hijo/a. */
export async function confirmarCitaPortal(
  citaId: string,
): Promise<{ ok?: boolean; error?: string }> {
  const sesion = leerSesionPortal();
  if (!sesion) return { error: "Sesión expirada." };

  const db = createAdminClient();
  const { data: cita } = await db
    .from("citas")
    .select("id, paciente_id, estatus")
    .eq("id", citaId)
    .maybeSingle();
  if (!cita || cita.paciente_id !== sesion.pid) {
    return { error: "Cita no encontrada." };
  }
  await db.from("citas").update({ estatus: "confirmada" }).eq("id", citaId);
  await avisarStaff(
    "Cita confirmada por el tutor",
    `${sesion.tut} confirmó la cita de ${sesion.pac}.`,
  );
  return { ok: true };
}

/** El padre solicita una nueva cita (se atiende en el sistema, sin WhatsApp). */
export async function solicitarCitaPortal(input: {
  fechaPreferida?: string;
  nota?: string;
}): Promise<{ ok?: boolean; error?: string }> {
  const sesion = leerSesionPortal();
  if (!sesion) return { error: "Sesión expirada." };

  const db = createAdminClient();
  const { data: acceso } = await db
    .from("portal_accesos")
    .select("tutor_id")
    .eq("id", sesion.aid)
    .maybeSingle();

  const { error } = await db.from("solicitudes_cita").insert({
    paciente_id: sesion.pid,
    tutor_id: acceso?.tutor_id ?? null,
    fecha_preferida: input.fechaPreferida || null,
    nota: input.nota || null,
  });
  if (error) return { error: "No se pudo enviar la solicitud." };

  await avisarStaff(
    "Nueva solicitud de cita",
    `${sesion.tut} solicitó una cita para ${sesion.pac}${
      input.fechaPreferida ? ` (preferencia: ${input.fechaPreferida})` : ""
    }.`,
  );
  return { ok: true };
}
