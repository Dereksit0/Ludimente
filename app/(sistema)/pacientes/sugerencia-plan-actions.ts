"use server";

import {
  generarSugerenciaPlan,
  type SugerenciaPlan,
} from "@/lib/ai/sugerencia-plan";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function requiereClinico() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = user?.app_metadata?.role;
  if (!user || (role !== "admin" && role !== "psicologo")) {
    throw new Error("No autorizado");
  }
}

function calcularEdad(fechaNacimiento: string): number | null {
  const nacimiento = new Date(fechaNacimiento);
  if (Number.isNaN(nacimiento.getTime())) return null;
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return edad;
}

export interface InputSugerenciaPlan {
  nombrePaciente?: string;
  fechaNacimiento?: string | null;
  motivoConsulta?: string | null;
  diagnosticoPrincipal?: string | null;
  diagnosticosSecundarios?: string[];
  informacionMedica?: string | null;
  entrevistaRespuestas?: string | null;
}

export type ResultadoSugerenciaPlan =
  | { ok: true; data: SugerenciaPlan }
  | { ok: false; error: string };

export async function sugerirPlanIntervencion(
  input: InputSugerenciaPlan,
): Promise<ResultadoSugerenciaPlan> {
  try {
    await requiereClinico();

    const db = createAdminClient();
    const [{ data: paquetes }, { data: config }] = await Promise.all([
      db
        .from("paquetes")
        .select("nombre, num_sesiones, precio")
        .eq("activo", true)
        .order("num_sesiones"),
      db
        .from("configuracion")
        .select("precio_sesion_default")
        .limit(1)
        .maybeSingle(),
    ]);

    const data = await generarSugerenciaPlan({
      nombrePaciente: input.nombrePaciente,
      edadAnios: input.fechaNacimiento
        ? calcularEdad(input.fechaNacimiento)
        : null,
      motivoConsulta: input.motivoConsulta,
      diagnosticoPrincipal: input.diagnosticoPrincipal,
      diagnosticosSecundarios: input.diagnosticosSecundarios,
      informacionMedica: input.informacionMedica,
      entrevistaRespuestas: input.entrevistaRespuestas,
      catalogoPaquetes: paquetes ?? [],
      precioSesionDefault: Number(config?.precio_sesion_default ?? 500),
    });

    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "No se pudo generar la sugerencia de plan.",
    };
  }
}
