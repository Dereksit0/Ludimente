"use client";

import { useQuery } from "@tanstack/react-query";
import {
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfDay,
  format,
  startOfMonth,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";

import { createClient } from "@/lib/supabase/client";
import { ESTATUS_CITA_LABEL, ESTATUS_PACIENTE_LABEL } from "@/types/app.types";
import { METODO_PAGO_OPCIONES } from "@/lib/catalogos";
import type { EstatusCita, EstatusPaciente, MetodoPago } from "@/types/database.types";

export interface FiltrosReportes {
  desde?: string;
  hasta?: string;
  psicologoId?: string;
}

export interface ReportesData {
  pacientesPorEstatus: { nombre: string; total: number }[];
  citasPorDia: { dia: string; total: number }[];
  citasPorEstatus: { nombre: string; total: number }[];
  ingresosPorMes: { mes: string; total: number }[];
  nuevosPacientesPorMes: { mes: string; total: number }[];
  pacientesPorTerapeuta: { nombre: string; total: number }[];
  diagnosticosTop: { nombre: string; total: number }[];
  ingresosPorMetodo: { nombre: string; total: number }[];
  ausentismoPorPaciente: { nombre: string; total: number }[];
  totales: {
    pacientes: number;
    citasRango: number;
    ingresosRango: number;
    porCobrar: number;
    tasaAsistencia: number;
    ocupacionPct: number;
  };
}

const DIAS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
const DIAS_CORTO = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const METODO_LABEL: Record<string, string> = Object.fromEntries(
  METODO_PAGO_OPCIONES.map((m) => [m.value, m.label]),
);
const horas = (t?: string | null) => {
  if (!t) return 0;
  const [h, m] = t.split(":");
  return Number(h) + Number(m) / 60;
};

export function useReportes(filtros: FiltrosReportes = {}) {
  return useQuery({
    queryKey: ["reportes", filtros.desde ?? "", filtros.hasta ?? "", filtros.psicologoId ?? ""],
    queryFn: async (): Promise<ReportesData> => {
      const supabase = createClient();
      const desde = filtros.desde
        ? new Date(`${filtros.desde}T00:00:00`)
        : startOfMonth(subMonths(new Date(), 5));
      const hasta = filtros.hasta ? endOfDay(new Date(`${filtros.hasta}T00:00:00`)) : new Date();

      let citasQ = supabase
        .from("citas")
        .select("paciente_id, psicologo_id, fecha_inicio, fecha_fin, estatus")
        .gte("fecha_inicio", desde.toISOString())
        .lte("fecha_inicio", hasta.toISOString());
      if (filtros.psicologoId) citasQ = citasQ.eq("psicologo_id", filtros.psicologoId);

      let pacQ = supabase
        .from("pacientes")
        .select("id, nombre, apellido_paterno, estatus, psicologo_asignado_id, diagnostico_principal, fecha_ingreso");
      if (filtros.psicologoId) pacQ = pacQ.eq("psicologo_asignado_id", filtros.psicologoId);

      const [cit, pac, pag, perf, cfg] = await Promise.all([
        citasQ,
        pacQ,
        supabase
          .from("pagos")
          .select("monto_final, fecha_pago, estatus, metodo_pago")
          .gte("fecha_pago", desde.toISOString())
          .lte("fecha_pago", hasta.toISOString()),
        supabase.from("profiles").select("id, full_name, role, activo"),
        supabase
          .from("configuracion")
          .select("horario_inicio, horario_fin, dias_laborales")
          .limit(1)
          .maybeSingle(),
      ]);

      const citas = cit.data ?? [];
      const pacientes = pac.data ?? [];
      const pagos = pag.data ?? [];
      const perfMap = new Map((perf.data ?? []).map((p) => [p.id, p.full_name]));
      const pacMap = new Map(
        pacientes.map((p) => [p.id, `${p.nombre} ${p.apellido_paterno}`]),
      );

      // Pacientes por estatus
      const estatusCount: Record<string, number> = {};
      for (const p of pacientes)
        estatusCount[p.estatus] = (estatusCount[p.estatus] ?? 0) + 1;
      const pacientesPorEstatus = Object.entries(estatusCount).map(([k, total]) => ({
        nombre: ESTATUS_PACIENTE_LABEL[k as EstatusPaciente] ?? k,
        total,
      }));

      // Citas por día de la semana
      const diaCount = new Array(7).fill(0);
      for (const c of citas) diaCount[new Date(c.fecha_inicio).getDay()]++;
      const citasPorDia = [1, 2, 3, 4, 5, 6].map((i) => ({
        dia: DIAS_CORTO[i],
        total: diaCount[i],
      }));

      // Citas por estatus + tasa de asistencia + ausentismo
      const citaEstatusCount: Record<string, number> = {};
      const ausentismo: Record<string, number> = {};
      let horasAgendadas = 0;
      for (const c of citas) {
        citaEstatusCount[c.estatus] = (citaEstatusCount[c.estatus] ?? 0) + 1;
        if (c.estatus === "no_asistio")
          ausentismo[c.paciente_id] = (ausentismo[c.paciente_id] ?? 0) + 1;
        if (c.estatus !== "cancelada" && c.estatus !== "no_asistio") {
          horasAgendadas +=
            (new Date(c.fecha_fin).getTime() - new Date(c.fecha_inicio).getTime()) /
            3_600_000;
        }
      }
      const citasPorEstatus = Object.entries(citaEstatusCount).map(([k, total]) => ({
        nombre: ESTATUS_CITA_LABEL[k as EstatusCita] ?? k,
        total,
      }));
      const completadas = citaEstatusCount["completada"] ?? 0;
      const noAsistio = citaEstatusCount["no_asistio"] ?? 0;
      const tasaAsistencia =
        completadas + noAsistio > 0
          ? Math.round((completadas / (completadas + noAsistio)) * 100)
          : 0;
      const ausentismoPorPaciente = Object.entries(ausentismo)
        .map(([id, total]) => ({ nombre: pacMap.get(id) ?? "—", total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 7);

      // Diagnósticos top
      const diagCount: Record<string, number> = {};
      for (const p of pacientes) {
        if (!p.diagnostico_principal) continue;
        diagCount[p.diagnostico_principal] =
          (diagCount[p.diagnostico_principal] ?? 0) + 1;
      }
      const diagnosticosTop = Object.entries(diagCount)
        .map(([nombre, total]) => ({ nombre, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 7);

      // Series mensuales dentro del rango
      const meses = eachMonthOfInterval({ start: startOfMonth(desde), end: hasta });
      const ingresoPorKey: Record<string, number> = {};
      const nuevosPorKey: Record<string, number> = {};
      const metodoCount: Record<string, number> = {};
      let ingresosRango = 0;
      for (const p of pagos) {
        if (p.estatus !== "pagado" || !p.fecha_pago) continue;
        const key = format(new Date(p.fecha_pago), "yyyy-MM");
        const monto = Number(p.monto_final ?? 0);
        ingresoPorKey[key] = (ingresoPorKey[key] ?? 0) + monto;
        ingresosRango += monto;
        metodoCount[p.metodo_pago as MetodoPago] =
          (metodoCount[p.metodo_pago as MetodoPago] ?? 0) + monto;
      }
      for (const p of pacientes) {
        if (!p.fecha_ingreso) continue;
        const key = format(new Date(p.fecha_ingreso), "yyyy-MM");
        nuevosPorKey[key] = (nuevosPorKey[key] ?? 0) + 1;
      }
      const ingresosPorMes = meses.map((d) => ({
        mes: format(d, "MMM yy", { locale: es }),
        total: ingresoPorKey[format(d, "yyyy-MM")] ?? 0,
      }));
      const nuevosPacientesPorMes = meses.map((d) => ({
        mes: format(d, "MMM yy", { locale: es }),
        total: nuevosPorKey[format(d, "yyyy-MM")] ?? 0,
      }));
      const ingresosPorMetodo = Object.entries(metodoCount).map(([k, total]) => ({
        nombre: METODO_LABEL[k] ?? k,
        total,
      }));

      // Pacientes por terapeuta
      const terapCount: Record<string, number> = {};
      for (const p of pacientes) {
        if (!p.psicologo_asignado_id) continue;
        const nombre = perfMap.get(p.psicologo_asignado_id) ?? "—";
        terapCount[nombre] = (terapCount[nombre] ?? 0) + 1;
      }
      const pacientesPorTerapeuta = Object.entries(terapCount).map(
        ([nombre, total]) => ({ nombre, total }),
      );

      // Ocupación de agenda: horas agendadas vs disponibles
      const jornada = cfg.data
        ? Math.max(horas(cfg.data.horario_fin) - horas(cfg.data.horario_inicio), 0)
        : 8;
      const diasLab = cfg.data?.dias_laborales ?? [
        "lunes",
        "martes",
        "miercoles",
        "jueves",
        "viernes",
      ];
      const diasHabiles = eachDayOfInterval({ start: desde, end: hasta }).filter(
        (d) => diasLab.includes(DIAS[d.getDay()]),
      ).length;
      const nTerapeutas = filtros.psicologoId
        ? 1
        : Math.max(
            (perf.data ?? []).filter(
              (p) => (p.role === "psicologo" || p.role === "admin") && p.activo,
            ).length,
            1,
          );
      const horasDisponibles = diasHabiles * jornada * nTerapeutas;
      const ocupacionPct =
        horasDisponibles > 0
          ? Math.min(Math.round((horasAgendadas / horasDisponibles) * 100), 100)
          : 0;

      const porCobrar = 0; // se calcula aparte en Cobranza (pagos pendientes sin rango)

      return {
        pacientesPorEstatus,
        citasPorDia,
        citasPorEstatus,
        ingresosPorMes,
        nuevosPacientesPorMes,
        pacientesPorTerapeuta,
        diagnosticosTop,
        ingresosPorMetodo,
        ausentismoPorPaciente,
        totales: {
          pacientes: pacientes.length,
          citasRango: citas.length,
          ingresosRango,
          porCobrar,
          tasaAsistencia,
          ocupacionPct,
        },
      };
    },
  });
}
