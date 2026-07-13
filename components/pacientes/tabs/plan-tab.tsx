"use client";

import Link from "next/link";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Target } from "lucide-react";

import { BarraAvance } from "@/components/planes/barra-avance";
import { Button } from "@/components/ui/button";
import { LudaCard } from "@/components/ui/luda-card";
import { usePlanes } from "@/hooks/use-planes";
import { ESTATUS_PLAN_CLASES, ESTATUS_PLAN_LABEL } from "@/types/app.types";
import type { PacienteDetalle } from "@/hooks/use-pacientes";
import type { EstatusPlan } from "@/types/database.types";

export function PlanTab({ paciente }: { paciente: PacienteDetalle }) {
  const { data: todos = [], isLoading } = usePlanes();
  const planes = todos.filter((p) => p.paciente_id === paciente.id);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-luda-gris-light">
          Planes de intervención del paciente
        </p>
        <Button asChild size="sm" variant="outline">
          <Link href={`/planes?paciente=${paciente.id}`}>
            <Plus className="h-4 w-4" /> Nuevo plan
          </Link>
        </Button>
      </div>

      {isLoading && <p className="text-sm text-luda-gris-light">Cargando…</p>}

      {!isLoading && planes.length === 0 && (
        <LudaCard className="p-6 text-center">
          <Target className="mx-auto h-8 w-8 text-luda-lila" />
          <p className="mt-2 text-sm text-luda-gris-light">
            Sin planes de intervención. Crea uno desde el módulo Planes.
          </p>
        </LudaCard>
      )}

      {planes.map((p) => (
        <Link key={p.id} href={`/planes/${p.id}`} className="block">
          <LudaCard className="p-4 transition-colors hover:bg-luda-lila-light/40">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate font-bold text-luda-gris">{p.titulo}</p>
              <span
                className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${
                  ESTATUS_PLAN_CLASES[p.estatus as EstatusPlan]
                }`}
              >
                {ESTATUS_PLAN_LABEL[p.estatus as EstatusPlan]}
              </span>
            </div>
            <div className="mt-3">
              <BarraAvance valor={p.avance} />
            </div>
            <p className="mt-1.5 text-xs text-luda-gris-light">
              {p.total_objetivos} objetivo(s) ·{" "}
              {format(new Date(p.fecha_inicio), "d MMM yyyy", { locale: es })}
            </p>
          </LudaCard>
        </Link>
      ))}
    </div>
  );
}
