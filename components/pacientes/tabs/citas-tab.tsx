"use client";

import { useState } from "react";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarPlus, Clock, Video } from "lucide-react";
import { toast } from "sonner";

import { CitaForm } from "@/components/agenda/cita-form";
import { Button } from "@/components/ui/button";
import { LudaBadge } from "@/components/ui/luda-badge";
import { LudaCard } from "@/components/ui/luda-card";
import { Modal } from "@/components/ui/modal";
import { useCitasPaciente, useCrearCita } from "@/hooks/use-citas";
import type { PacienteDetalle } from "@/hooks/use-pacientes";
import { TIPO_CITA_LABEL } from "@/types/app.types";
import type { CitaInput } from "@/lib/validations/cita.schema";

export function CitasTab({ paciente }: { paciente: PacienteDetalle }) {
  const { data: citas = [], isLoading } = useCitasPaciente(paciente.id);
  const crear = useCrearCita();
  const [abierto, setAbierto] = useState(false);

  async function guardar(valores: CitaInput) {
    try {
      await crear.mutateAsync(valores);
      toast.success("Cita creada");
      setAbierto(false);
    } catch {
      toast.error("No se pudo crear la cita");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-luda-gris">Citas del paciente</h3>
        <Button size="sm" onClick={() => setAbierto(true)}>
          <CalendarPlus className="h-4 w-4" /> Nueva cita
        </Button>
      </div>

      {isLoading && (
        <p className="text-sm text-luda-gris-light">Cargando citas…</p>
      )}
      {!isLoading && citas.length === 0 && (
        <LudaCard className="p-6">
          <p className="text-sm text-luda-gris-light">
            Este paciente no tiene citas registradas.
          </p>
        </LudaCard>
      )}

      <div className="space-y-2">
        {citas.map((c) => (
          <LudaCard key={c.id} className="flex items-center gap-3 p-4">
            <div className="flex-1">
              <p className="flex items-center gap-1.5 text-sm font-bold text-luda-gris">
                <Clock className="h-3.5 w-3.5" />
                {format(new Date(c.fecha_inicio), "EEE d 'de' MMM · HH:mm", {
                  locale: es,
                })}
                {c.modalidad === "videollamada" && (
                  <Video className="h-3.5 w-3.5 text-luda-lila-dark" />
                )}
              </p>
              <p className="text-xs text-luda-gris-light">
                {TIPO_CITA_LABEL[c.tipo] ?? c.tipo} · {c.psicologo?.full_name}
              </p>
            </div>
            <LudaBadge tipo="cita" status={c.estatus} />
          </LudaCard>
        ))}
      </div>

      <Modal abierto={abierto} onCerrar={() => setAbierto(false)} titulo="Nueva cita">
        <CitaForm
          pacienteFijo={paciente.id}
          inicial={{
            psicologo_id: paciente.psicologo_asignado_id ?? undefined,
          }}
          guardando={crear.isPending}
          onGuardar={guardar}
        />
      </Modal>
    </div>
  );
}
