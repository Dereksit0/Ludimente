"use client";

import { useState } from "react";

import {
  CalendarDays,
  Download,
  Gauge,
  Percent,
  Users,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  LudaCard,
  LudaCardContent,
  LudaCardHeader,
  LudaCardTitle,
} from "@/components/ui/luda-card";
import { LudaStat } from "@/components/ui/luda-stat";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { usePsicologos } from "@/hooks/use-perfiles";
import { useReportes } from "@/hooks/use-reportes";
import { useRolActual } from "@/hooks/use-rol";
import { imprimirReporte } from "@/lib/print-reporte";

const COLORES = ["#9B70C4", "#A8C8E8", "#F2B5C8", "#FCD9A8", "#B8E0C8", "#D7B8E8", "#F5C6A5"];
const mx = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 0 })}`;

function GraficaBarras({
  titulo,
  data,
  color,
  vertical,
}: {
  titulo: string;
  data: { nombre?: string; dia?: string; total: number }[];
  color: string;
  vertical?: boolean;
}) {
  return (
    <LudaCard>
      <LudaCardHeader>
        <LudaCardTitle>{titulo}</LudaCardTitle>
      </LudaCardHeader>
      <LudaCardContent>
        {data.length === 0 ? (
          <p className="py-10 text-center text-sm text-luda-gris-light">Sin datos</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} layout={vertical ? "vertical" : "horizontal"}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              {vertical ? (
                <>
                  <XAxis type="number" allowDecimals={false} fontSize={12} />
                  <YAxis type="category" dataKey="nombre" width={110} fontSize={11} />
                </>
              ) : (
                <>
                  <XAxis dataKey={data[0]?.dia ? "dia" : "nombre"} fontSize={12} />
                  <YAxis allowDecimals={false} fontSize={12} />
                </>
              )}
              <Tooltip />
              <Bar dataKey="total" fill={color} radius={vertical ? [0, 6, 6, 0] : [6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </LudaCardContent>
    </LudaCard>
  );
}

export function ReportesCliente() {
  const { data: rol } = useRolActual();
  const esAdmin = rol === "admin";
  const { data: psicologos = [] } = usePsicologos();

  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [psicologoId, setPsicologoId] = useState("");

  const { data, isLoading, isError } = useReportes({
    desde: desde || undefined,
    hasta: hasta || undefined,
    psicologoId: psicologoId || undefined,
  });

  function exportar() {
    if (!data) return;
    const terapeuta = psicologoId
      ? (psicologos.find((p) => p.id === psicologoId)?.full_name ?? "—")
      : "Todos";
    imprimirReporte(data, { desde, hasta, terapeuta, esAdmin });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-fredoka text-3xl text-luda-gris">Reportes</h1>
        <Button
          size="sm"
          variant="outline"
          className="ml-auto"
          onClick={exportar}
          disabled={!data}
        >
          <Download className="h-4 w-4" /> Exportar PDF
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs font-semibold text-luda-gris-light">
          Desde
          <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="h-9" />
        </label>
        <label className="text-xs font-semibold text-luda-gris-light">
          Hasta
          <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="h-9" />
        </label>
        <Select
          value={psicologoId}
          onChange={(e) => setPsicologoId(e.target.value)}
          className="h-9 w-auto text-xs"
        >
          <option value="">Todos los terapeutas</option>
          {psicologos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
            </option>
          ))}
        </Select>
      </div>

      {isError && (
        <LudaCard className="border border-red-200 bg-red-50 p-6">
          <p className="text-sm font-semibold text-red-600">
            No se pudieron cargar los reportes. Intenta recargar la página.
          </p>
        </LudaCard>
      )}

      {!isError && (isLoading || !data) ? (
        <div className="space-y-4">
          <div className="skeleton-luda h-24" />
          <div className="skeleton-luda h-64" />
        </div>
      ) : !isError && data ? (
        <>
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <LudaStat label="Pacientes" value={data.totales.pacientes} icon={Users} acento="lila" />
            <LudaStat label="Citas en periodo" value={data.totales.citasRango} icon={CalendarDays} acento="azul" />
            <LudaStat label="Asistencia" value={`${data.totales.tasaAsistencia}%`} icon={Percent} acento="amarillo" />
            <LudaStat label="Ocupación agenda" value={`${data.totales.ocupacionPct}%`} icon={Gauge} acento="rosa" />
            {esAdmin && (
              <LudaStat label="Ingresos" value={mx(data.totales.ingresosRango)} icon={Wallet} acento="lila" />
            )}
          </section>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <LudaCard>
              <LudaCardHeader>
                <LudaCardTitle>Pacientes por estatus</LudaCardTitle>
              </LudaCardHeader>
              <LudaCardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={data.pacientesPorEstatus}
                      dataKey="total"
                      nameKey="nombre"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {data.pacientesPorEstatus.map((_, i) => (
                        <Cell key={i} fill={COLORES[i % COLORES.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </LudaCardContent>
            </LudaCard>

            <GraficaBarras titulo="Citas por día" data={data.citasPorDia} color="#9B70C4" />
            <GraficaBarras titulo="Citas por estatus" data={data.citasPorEstatus} color="#D7B8E8" vertical />
            <GraficaBarras titulo="Pacientes por terapeuta" data={data.pacientesPorTerapeuta} color="#A8C8E8" vertical />
            <GraficaBarras titulo="Ausentismo por paciente" data={data.ausentismoPorPaciente} color="#F2B5C8" vertical />
            <GraficaBarras titulo="Diagnósticos más frecuentes" data={data.diagnosticosTop} color="#FCD9A8" vertical />
            {esAdmin && (
              <GraficaBarras
                titulo="Ingresos por mes"
                data={data.ingresosPorMes.map((m) => ({ nombre: m.mes, total: m.total }))}
                color="#B8E0C8"
              />
            )}
            {esAdmin && (
              <GraficaBarras
                titulo="Ingresos por tipo de cita"
                data={data.ingresosPorTipoCita}
                color="#9B70C4"
                vertical
              />
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
