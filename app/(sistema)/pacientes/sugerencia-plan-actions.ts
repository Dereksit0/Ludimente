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

export type ResultadoCrearPlan =
  | { ok: true; planId: string }
  | { ok: false; error: string };

/** Persiste la propuesta de la IA como el plan de intervención real del paciente. */
export async function crearPlanDesdeSugerencia(
  pacienteId: string,
  sugerencia: SugerenciaPlan,
): Promise<ResultadoCrearPlan> {
  try {
    await requiereClinico();

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("No autorizado");

    const role = user.app_metadata?.role;
    const psicologoId = role === "psicologo" ? user.id : null;

    const fechaInicio = new Date().toISOString().slice(0, 10);
    const fechaFin = new Date();
    fechaFin.setMonth(fechaFin.getMonth() + sugerencia.duracionEstimadaMeses);

    const { data: plan, error: errorPlan } = await supabase
      .from("planes_intervencion")
      .insert({
        paciente_id: pacienteId,
        psicologo_id: psicologoId,
        titulo: "Plan de intervención (propuesta IA revisada)",
        descripcion: sugerencia.justificacion,
        fecha_inicio: fechaInicio,
        fecha_fin_estimada: fechaFin.toISOString().slice(0, 10),
        estatus: "activo",
        created_by: user.id,
      })
      .select("id")
      .single();
    if (errorPlan) throw errorPlan;

    const { error: errorObjetivos } = await supabase
      .from("objetivos_intervencion")
      .insert(
        sugerencia.objetivos.map((o, i) => ({
          plan_id: plan.id,
          descripcion: o.descripcion,
          area: o.area,
          prioridad: o.prioridad,
          orden: i,
        })),
      );
    if (errorObjetivos) throw errorObjetivos;

    return { ok: true, planId: plan.id };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : "No se pudo crear el plan.",
    };
  }
}
