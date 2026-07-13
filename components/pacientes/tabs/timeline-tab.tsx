"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileText,
  NotebookPen,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { LudaCard } from "@/components/ui/luda-card";
import type { PacienteDetalle } from "@/hooks/use-pacientes";
import { useTimelinePaciente, type TipoEvento } from "@/hooks/use-timeline";

const META: Record<TipoEvento, { icon: LucideIcon; clase: string }> = {
  cita: { icon: CalendarDays, clase: "bg-luda-azul-light text-blue-700" },
  sesion: { icon: NotebookPen, clase: "bg-luda-lila-light text-luda-lila-dark" },
  pago: { icon: Wallet, clase: "bg-luda-rosa-light text-luda-rosa" },
  documento: { icon: FileText, clase: "bg-luda-amarillo-light text-yellow-700" },
  evaluacion: { icon: ClipboardList, clase: "bg-luda-azul-light text-blue-700" },
  tamizaje: { icon: ClipboardCheck, clase: "bg-green-100 text-green-700" },
};

export function TimelineTab({ paciente }: { paciente: PacienteDetalle }) {
  const { data: eventos = [], isLoading } = useTimelinePaciente(paciente.id);

  if (isLoading)
    return <p className="text-sm text-luda-gris-light">Cargando…</p>;
  if (eventos.length === 0)
    return (
      <LudaCard className="p-6">
        <p className="text-sm text-luda-gris-light">
          Aún no hay actividad registrada para este paciente.
        </p>
      </LudaCard>
    );

  return (
    <div className="relative space-y-3 pl-4">
      <div className="absolute bottom-2 left-[7px] top-2 w-px bg-luda-lila/20" />
      {eventos.map((ev) => {
        const { icon: Icon, clase } = META[ev.tipo];
        return (
          <div key={ev.id} className="relative flex items-start gap-3">
            <span
              className={`relative z-10 -ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-luda-fondo ${clase}`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <LudaCard className="flex-1 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-luda-gris">{ev.titulo}</p>
                <span className="text-xs capitalize text-luda-gris-light">
                  {format(new Date(ev.fecha), "d 'de' MMM yyyy", { locale: es })}
                </span>
              </div>
              <p className="text-xs text-luda-gris-light">{ev.detalle}</p>
            </LudaCard>
          </div>
        );
      })}
    </div>
  );
}
