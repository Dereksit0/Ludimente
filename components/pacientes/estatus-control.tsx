"use client";

import { toast } from "sonner";

import { Select } from "@/components/ui/select";
import { useActualizarPaciente, type PacienteDetalle } from "@/hooks/use-pacientes";
import { useRolActual } from "@/hooks/use-rol";
import { ESTATUS_PACIENTE_OPCIONES } from "@/lib/catalogos";
import type { EstatusPaciente, TablesUpdate } from "@/types/database.types";

const hoy = () => new Date().toISOString().slice(0, 10);

export function EstatusControl({ paciente }: { paciente: PacienteDetalle }) {
  const { data: rol } = useRolActual();
  const actualizar = useActualizarPaciente(paciente.id);
  const puedeEditar = rol === "admin" || rol === "psicologo";

  async function cambiar(nuevo: EstatusPaciente) {
    if (nuevo === paciente.estatus) return;
    const cambios: TablesUpdate<"pacientes"> = { estatus: nuevo };
    // Al dar de alta se registra la fecha; al reactivar se limpia.
    if (nuevo === "alta") cambios.fecha_alta = hoy();
    else if (paciente.estatus === "alta") cambios.fecha_alta = null;

    try {
      await actualizar.mutateAsync(cambios);
      toast.success("Estatus actualizado");
    } catch {
      toast.error("No se pudo cambiar el estatus");
    }
  }

  if (!puedeEditar) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-luda-gris-light">Estatus:</span>
      <Select
        value={paciente.estatus}
        onChange={(e) => cambiar(e.target.value as EstatusPaciente)}
        disabled={actualizar.isPending}
        className="h-9 w-auto text-xs"
      >
        {ESTATUS_PACIENTE_OPCIONES.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
