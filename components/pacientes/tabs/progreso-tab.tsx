"use client";

import Link from "next/link";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FileText, Plus, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LudaCard } from "@/components/ui/luda-card";
import { useConfiguracion } from "@/hooks/use-configuracion";
import { useReportesProgreso } from "@/hooks/use-reportes-progreso";
import { imprimirReporteProgreso } from "@/lib/print-progreso";
import type { PacienteDetalle } from "@/hooks/use-pacientes";

export function ProgresoTab({ paciente }: { paciente: PacienteDetalle }) {
  const { data: todos = [], isLoading } = useReportesProgreso();
  const { data: config } = useConfiguracion();
  const reportes = todos.filter((r) => r.paciente_id === paciente.id);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-luda-gris-light">
          Reportes de progreso para la familia
        </p>
        <Button asChild size="sm" variant="outline">
          <Link href={`/progreso?paciente=${paciente.id}`}>
            <Plus className="h-4 w-4" /> Nuevo reporte
          </Link>
        </Button>
      </div>

      {isLoading && <p className="text-sm text-luda-gris-light">Cargando…</p>}

      {!isLoading && reportes.length === 0 && (
        <LudaCard className="p-6 text-center">
          <FileText className="mx-auto h-8 w-8 text-luda-lila" />
          <p className="mt-2 text-sm text-luda-gris-light">
            Sin reportes. Genera uno desde el módulo Progreso.
          </p>
        </LudaCard>
      )}

      {reportes.map((r) => (
        <LudaCard key={r.id} className="flex flex-wrap items-center gap-3 p-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-luda-gris">{r.titulo}</p>
            <p className="text-xs text-luda-gris-light">
              {format(new Date(r.created_at), "d MMM yyyy", { locale: es })}
            </p>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              r.compartido
                ? "bg-green-50 text-green-700"
                : "bg-gray-50 text-gray-500"
            }`}
          >
            {r.compartido ? "Compartido" : "Privado"}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => imprimirReporteProgreso(r, config)}
          >
            <Printer className="h-4 w-4" /> Imprimir
          </Button>
        </LudaCard>
      ))}
    </div>
  );
}
