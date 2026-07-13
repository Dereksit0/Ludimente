"use client";

import Link from "next/link";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ClipboardCheck, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LudaCard } from "@/components/ui/luda-card";
import { useTamizajesPaciente } from "@/hooks/use-tamizaje";
import type { PacienteDetalle } from "@/hooks/use-pacientes";
import {
  NIVEL_TAMIZAJE_CLASES,
  NIVEL_TAMIZAJE_LABEL,
  TAMIZAJE_AREA_LABEL,
} from "@/lib/catalogos";

export function TamizajeTab({ paciente }: { paciente: PacienteDetalle }) {
  const { data: tamizajes = [], isLoading } = useTamizajesPaciente(paciente.id);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-luda-gris-light">
          Tamizajes aplicados a este paciente
        </p>
        <Button asChild size="sm" variant="outline">
          <Link href={`/tamizaje?paciente=${paciente.id}`}>
            <Plus className="h-4 w-4" /> Nuevo tamizaje
          </Link>
        </Button>
      </div>

      {isLoading && <p className="text-sm text-luda-gris-light">Cargando…</p>}

      {!isLoading && tamizajes.length === 0 && (
        <LudaCard className="p-6 text-center">
          <ClipboardCheck className="mx-auto h-8 w-8 text-luda-lila" />
          <p className="mt-2 text-sm text-luda-gris-light">
            Sin tamizaje registrado. Crea uno desde el módulo Tamizaje.
          </p>
        </LudaCard>
      )}

      {tamizajes.map((t) => {
        const areas = (t.areas ?? {}) as Record<string, string>;
        return (
          <LudaCard key={t.id} className="p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-luda-gris">
                Tamizaje del {format(new Date(t.fecha), "d 'de' MMM yyyy", { locale: es })}
              </p>
            </div>
            {t.observaciones && (
              <p className="mt-1 text-xs text-luda-gris-light">{t.observaciones}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {Object.entries(areas).map(([area, nivel]) => (
                <span
                  key={area}
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    NIVEL_TAMIZAJE_CLASES[nivel] ?? "bg-gray-100 text-gray-500"
                  }`}
                >
                  {TAMIZAJE_AREA_LABEL[area] ?? area}:{" "}
                  {NIVEL_TAMIZAJE_LABEL[nivel] ?? nivel}
                </span>
              ))}
            </div>
          </LudaCard>
        );
      })}
    </div>
  );
}
