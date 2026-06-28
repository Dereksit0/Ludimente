"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { CitaInput } from "@/lib/validations/cita.schema";
import type { CitaConRelaciones } from "@/types/app.types";
import type { EstatusCita } from "@/types/database.types";

export const citasKeys = {
  all: ["citas"] as const,
  rango: (desde: string, hasta: string) =>
    [...citasKeys.all, "rango", desde, hasta] as const,
  paciente: (id: string) => [...citasKeys.all, "paciente", id] as const,
};

/** Convierte fecha + hora + duración (form) a fecha_inicio/fecha_fin ISO. */
function aRango(fecha: string, hora: string, duracionMin: number) {
  const inicio = new Date(`${fecha}T${hora}:00`);
  const fin = new Date(inicio.getTime() + duracionMin * 60_000);
  return { fecha_inicio: inicio.toISOString(), fecha_fin: fin.toISOString() };
}

const DIAS_SEMANA = [
  "domingo",
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
];

/** Valida que la cita caiga en día laboral y dentro del horario configurado. */
async function validarContraHorario(fechaInicio: string, fechaFin: string) {
  const supabase = createClient();
  const { data: config } = await supabase
    .from("configuracion")
    .select("horario_inicio, horario_fin, dias_laborales")
    .limit(1)
    .maybeSingle();
  if (!config) return;

  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  const dia = DIAS_SEMANA[inicio.getDay()];
  if (config.dias_laborales && !config.dias_laborales.includes(dia)) {
    throw new Error("Ese día no es laboral según la configuración.");
  }
  const hhmm = (d: Date) => d.toTimeString().slice(0, 5);
  if (config.horario_inicio && hhmm(inicio) < config.horario_inicio.slice(0, 5)) {
    throw new Error("La cita inicia antes del horario laboral.");
  }
  if (config.horario_fin && hhmm(fin) > config.horario_fin.slice(0, 5)) {
    throw new Error("La cita termina después del horario laboral.");
  }
}

/** Lanza error si el terapeuta ya tiene una cita que se empalma en ese horario. */
async function verificarSolape(
  psicologoId: string,
  fechaInicio: string,
  fechaFin: string,
  excluirId?: string,
) {
  const supabase = createClient();
  let q = supabase
    .from("citas")
    .select("id")
    .eq("psicologo_id", psicologoId)
    .lt("fecha_inicio", fechaFin)
    .gt("fecha_fin", fechaInicio)
    .not("estatus", "in", "(cancelada,no_asistio,reagendada)");
  if (excluirId) q = q.neq("id", excluirId);
  const { data, error } = await q;
  if (error) throw error;
  if (data && data.length > 0) {
    throw new Error("El terapeuta ya tiene una cita en ese horario.");
  }
}

async function resolverRelaciones(
  citas: { paciente_id: string; psicologo_id: string }[],
) {
  const supabase = createClient();
  const pacIds = [...new Set(citas.map((c) => c.paciente_id))];
  const psiIds = [...new Set(citas.map((c) => c.psicologo_id))];

  const [{ data: pacientes }, { data: perfiles }] = await Promise.all([
    supabase
      .from("pacientes")
      .select("id, nombre, apellido_paterno, numero_expediente")
      .in("id", pacIds),
    supabase.from("profiles").select("id, full_name, color_agenda").in("id", psiIds),
  ]);

  return {
    pacMap: new Map((pacientes ?? []).map((p) => [p.id, p])),
    psiMap: new Map((perfiles ?? []).map((p) => [p.id, p])),
  };
}

/** Citas en un rango [desde, hasta] (ISO). */
export function useCitasRango(desde: string, hasta: string) {
  return useQuery({
    queryKey: citasKeys.rango(desde, hasta),
    queryFn: async (): Promise<CitaConRelaciones[]> => {
      const supabase = createClient();
      const { data: citas, error } = await supabase
        .from("citas")
        .select("*")
        .gte("fecha_inicio", desde)
        .lte("fecha_inicio", hasta)
        .order("fecha_inicio");
      if (error) throw error;

      const { pacMap, psiMap } = await resolverRelaciones(citas ?? []);
      return (citas ?? []).map((c) => ({
        ...c,
        paciente: pacMap.get(c.paciente_id)!,
        psicologo: psiMap.get(c.psicologo_id)!,
      })) as CitaConRelaciones[];
    },
  });
}

/** Citas de un paciente (todas, ordenadas por fecha descendente). */
export function useCitasPaciente(pacienteId: string) {
  return useQuery({
    queryKey: citasKeys.paciente(pacienteId),
    enabled: Boolean(pacienteId),
    queryFn: async (): Promise<CitaConRelaciones[]> => {
      const supabase = createClient();
      const { data: citas, error } = await supabase
        .from("citas")
        .select("*")
        .eq("paciente_id", pacienteId)
        .order("fecha_inicio", { ascending: false });
      if (error) throw error;

      const { pacMap, psiMap } = await resolverRelaciones(citas ?? []);
      return (citas ?? []).map((c) => ({
        ...c,
        paciente: pacMap.get(c.paciente_id)!,
        psicologo: psiMap.get(c.psicologo_id)!,
      })) as CitaConRelaciones[];
    },
  });
}

function invalidar(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: citasKeys.all });
}

export function useCrearCita() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CitaInput): Promise<void> => {
      const supabase = createClient();
      const { fecha, hora, duracion_min, notas_previas, ...resto } = input;
      const rango = aRango(fecha, hora, duracion_min);
      await validarContraHorario(rango.fecha_inicio, rango.fecha_fin);
      await verificarSolape(input.psicologo_id, rango.fecha_inicio, rango.fecha_fin);
      const { error } = await supabase.from("citas").insert({
        ...resto,
        notas_previas: notas_previas || null,
        ...rango,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidar(qc),
  });
}

export function useActualizarCita() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: CitaInput;
    }): Promise<void> => {
      const supabase = createClient();
      const { fecha, hora, duracion_min, notas_previas, ...resto } = input;
      const rango = aRango(fecha, hora, duracion_min);
      await validarContraHorario(rango.fecha_inicio, rango.fecha_fin);
      await verificarSolape(input.psicologo_id, rango.fecha_inicio, rango.fecha_fin, id);
      const { error } = await supabase
        .from("citas")
        .update({
          ...resto,
          notas_previas: notas_previas || null,
          ...rango,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidar(qc),
  });
}

export function useCambiarEstatusCita() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      estatus,
      motivo,
    }: {
      id: string;
      estatus: EstatusCita;
      motivo?: string;
    }): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("citas")
        .update({
          estatus,
          motivo_cancelacion: motivo ?? null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidar(qc),
  });
}

export function useEliminarCita() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase.from("citas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidar(qc),
  });
}

/** Reagenda una cita (arrastrar): mueve el rango conservando la duración. */
export function useReagendarCita() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      psicologoId,
      fechaInicio,
      fechaFin,
    }: {
      id: string;
      psicologoId: string;
      fechaInicio: string;
      fechaFin: string;
    }): Promise<void> => {
      const supabase = createClient();
      await validarContraHorario(fechaInicio, fechaFin);
      await verificarSolape(psicologoId, fechaInicio, fechaFin, id);
      const { error } = await supabase
        .from("citas")
        .update({ fecha_inicio: fechaInicio, fecha_fin: fechaFin })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidar(qc),
  });
}

/**
 * Cierra una cita como completada y genera un cobro pendiente ligado.
 * Devuelve nada; la nota de sesión se ofrece aparte en la UI.
 */
export function useCompletarCita() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      citaId,
      pacienteId,
      concepto,
    }: {
      citaId: string;
      pacienteId: string;
      concepto: string;
    }): Promise<void> => {
      const supabase = createClient();
      const { error: e1 } = await supabase
        .from("citas")
        .update({ estatus: "completada" })
        .eq("id", citaId);
      if (e1) throw e1;

      // El cobro se genera vía función SECURITY DEFINER: `pagos` es solo-admin
      // por RLS, pero el equipo clínico puede disparar el cobro del sistema.
      const { error: e2 } = await supabase.rpc("generar_cobro_cita", {
        p_cita_id: citaId,
        p_paciente_id: pacienteId,
        p_concepto: concepto,
      });
      if (e2) throw e2;
    },
    onSuccess: () => {
      invalidar(qc);
      void qc.invalidateQueries({ queryKey: ["pagos"] });
      void qc.invalidateQueries({ queryKey: ["cobranza"] });
      void qc.invalidateQueries({ queryKey: ["reportes"] });
    },
  });
}
