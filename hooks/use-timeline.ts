"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import {
  ESTATUS_CITA_LABEL,
  ESTATUS_PAGO_LABEL,
  TIPO_CITA_LABEL,
} from "@/types/app.types";
import {
  AREA_TRABAJO_LABEL,
  ESTATUS_EVALUACION_LABEL,
  TIPO_DOCUMENTO_LABEL,
} from "@/lib/catalogos";

export type TipoEvento =
  | "cita"
  | "sesion"
  | "pago"
  | "documento"
  | "evaluacion"
  | "tamizaje";

export interface EventoTimeline {
  id: string;
  tipo: TipoEvento;
  fecha: string;
  titulo: string;
  detalle: string;
}

const mx = (n: number) =>
  `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

export function useTimelinePaciente(pacienteId: string) {
  return useQuery({
    queryKey: ["timeline", pacienteId],
    enabled: Boolean(pacienteId),
    queryFn: async (): Promise<EventoTimeline[]> => {
      const supabase = createClient();
      const [citas, sesiones, pagos, documentos, evaluaciones, tamizajes] =
        await Promise.all([
          supabase
            .from("citas")
            .select("id, fecha_inicio, tipo, estatus")
            .eq("paciente_id", pacienteId),
          supabase
            .from("sesiones")
            .select("id, fecha_sesion, numero_sesion, area_trabajo")
            .eq("paciente_id", pacienteId)
            .is("deleted_at", null),
          // pagos queda vacío para quien no sea admin (RLS).
          supabase
            .from("pagos")
            .select("id, concepto, monto_final, estatus, fecha_pago, created_at")
            .eq("paciente_id", pacienteId),
          supabase
            .from("documentos")
            .select("id, nombre_display, tipo, created_at")
            .eq("paciente_id", pacienteId),
          supabase
            .from("evaluaciones")
            .select("id, tipo_prueba, nombre_personalizado, fecha_aplicacion, estatus")
            .eq("paciente_id", pacienteId)
            .is("deleted_at", null),
          supabase
            .from("tamizajes")
            .select("id, fecha, areas")
            .eq("paciente_id", pacienteId),
        ]);

      const eventos: EventoTimeline[] = [];

      for (const c of citas.data ?? []) {
        eventos.push({
          id: `cita-${c.id}`,
          tipo: "cita",
          fecha: c.fecha_inicio,
          titulo: TIPO_CITA_LABEL[c.tipo] ?? "Cita",
          detalle: ESTATUS_CITA_LABEL[c.estatus] ?? c.estatus,
        });
      }
      for (const s of sesiones.data ?? []) {
        eventos.push({
          id: `sesion-${s.id}`,
          tipo: "sesion",
          fecha: s.fecha_sesion,
          titulo: `Sesión #${s.numero_sesion}`,
          detalle: s.area_trabajo
            ? (AREA_TRABAJO_LABEL[s.area_trabajo] ?? s.area_trabajo)
            : "Nota clínica",
        });
      }
      for (const p of pagos.data ?? []) {
        eventos.push({
          id: `pago-${p.id}`,
          tipo: "pago",
          fecha: p.fecha_pago ?? p.created_at,
          titulo: `${p.concepto} · ${mx(Number(p.monto_final ?? 0))}`,
          detalle: ESTATUS_PAGO_LABEL[p.estatus] ?? p.estatus,
        });
      }
      for (const d of documentos.data ?? []) {
        eventos.push({
          id: `doc-${d.id}`,
          tipo: "documento",
          fecha: d.created_at,
          titulo: d.nombre_display,
          detalle: TIPO_DOCUMENTO_LABEL[d.tipo] ?? d.tipo,
        });
      }
      for (const e of evaluaciones.data ?? []) {
        eventos.push({
          id: `evaluacion-${e.id}`,
          tipo: "evaluacion",
          fecha: e.fecha_aplicacion,
          titulo: e.nombre_personalizado || e.tipo_prueba,
          detalle: ESTATUS_EVALUACION_LABEL[e.estatus] ?? e.estatus,
        });
      }
      for (const t of tamizajes.data ?? []) {
        const areas = (t.areas ?? {}) as Record<string, unknown>;
        const numAreas = Object.keys(areas).length;
        eventos.push({
          id: `tamizaje-${t.id}`,
          tipo: "tamizaje",
          fecha: t.fecha,
          titulo: "Tamizaje inicial",
          detalle: numAreas > 0 ? `${numAreas} área(s) evaluadas` : "Aplicado",
        });
      }

      return eventos.sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
      );
    },
  });
}
