"use client";

import { toast } from "sonner";

import { CampoEditable } from "@/components/pacientes/campo-editable";
import { LudaCard, LudaCardContent, LudaCardHeader, LudaCardTitle } from "@/components/ui/luda-card";
import { Select } from "@/components/ui/select";
import { useActualizarPaciente, type PacienteDetalle } from "@/hooks/use-pacientes";
import { usePsicologos } from "@/hooks/use-perfiles";
import { useRolActual } from "@/hooks/use-rol";
import { ESTATUS_PACIENTE_OPCIONES } from "@/lib/catalogos";
import { fechaLarga } from "@/lib/fechas";
import type { EstatusPaciente, TablesUpdate } from "@/types/database.types";

export function InfoTab({ paciente }: { paciente: PacienteDetalle }) {
  const actualizar = useActualizarPaciente(paciente.id);
  const { data: psicologos } = usePsicologos();
  const { data: rol } = useRolActual();
  // Recepción solo tiene lectura sobre pacientes (sin UPDATE en RLS).
  const soloLectura = rol === "recepcionista";

  async function guardar(cambios: TablesUpdate<"pacientes">, ok = "Actualizado ⭐") {
    try {
      await actualizar.mutateAsync(cambios);
      toast.success(ok);
    } catch {
      toast.error("No se pudo guardar el cambio.");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Asignación rápida */}
      <LudaCard>
        <LudaCardHeader>
          <LudaCardTitle>Estatus y asignación</LudaCardTitle>
        </LudaCardHeader>
        <LudaCardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-luda-gris-light">
              Estatus
            </p>
            <Select
              value={paciente.estatus}
              disabled={soloLectura}
              onChange={(e) =>
                guardar({ estatus: e.target.value as EstatusPaciente })
              }
            >
              {ESTATUS_PACIENTE_OPCIONES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-luda-gris-light">
              Terapeuta asignado
            </p>
            <Select
              value={paciente.psicologo_asignado_id ?? ""}
              disabled={soloLectura}
              onChange={(e) =>
                guardar({ psicologo_asignado_id: e.target.value || null })
              }
            >
              <option value="">Sin asignar</option>
              {(psicologos ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </Select>
          </div>
        </LudaCardContent>
      </LudaCard>

      {/* Datos personales */}
      <LudaCard>
        <LudaCardHeader>
          <LudaCardTitle>Datos personales</LudaCardTitle>
        </LudaCardHeader>
        <LudaCardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-1">
            <CampoEditable
              soloLectura={soloLectura}
              label="Cumpleaños"
              valor={paciente.fecha_nacimiento}
              tipo="date"
              onGuardar={(v) => guardar({ fecha_nacimiento: v })}
            />
            <p className="text-xs text-luda-gris-light">
              {fechaLarga(paciente.fecha_nacimiento)}
            </p>
          </div>
          <CampoEditable
            soloLectura={soloLectura}
            label="Escuela"
            valor={paciente.escuela}
            onGuardar={(v) => guardar({ escuela: v || null })}
          />
          <CampoEditable
            soloLectura={soloLectura}
            label="Grado escolar"
            valor={paciente.grado_escolar}
            onGuardar={(v) => guardar({ grado_escolar: v || null })}
          />
          <CampoEditable
            soloLectura={soloLectura}
            label="Motivo de consulta"
            valor={paciente.motivo_consulta}
            tipo="textarea"
            onGuardar={(v) => guardar({ motivo_consulta: v })}
            className="sm:col-span-2"
          />
        </LudaCardContent>
      </LudaCard>

      {/* Información médica */}
      <LudaCard>
        <LudaCardHeader>
          <LudaCardTitle>Información médica</LudaCardTitle>
        </LudaCardHeader>
        <LudaCardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <CampoEditable
            soloLectura={soloLectura}
            label="Diagnóstico principal"
            valor={paciente.diagnostico_principal}
            onGuardar={(v) => guardar({ diagnostico_principal: v || null })}
          />
          <CampoEditable
            soloLectura={soloLectura}
            label="Alergias"
            valor={paciente.alergias}
            onGuardar={(v) => guardar({ alergias: v || null })}
          />
          <CampoEditable
            soloLectura={soloLectura}
            label="Medicamentos"
            valor={paciente.medicamentos}
            onGuardar={(v) => guardar({ medicamentos: v || null })}
          />
          <CampoEditable
            soloLectura={soloLectura}
            label="Antecedentes terapéuticos o clínicos"
            valor={paciente.antecedentes}
            tipo="textarea"
            placeholder="Terapias previas, diagnósticos anteriores, hospitalizaciones, tratamientos…"
            onGuardar={(v) => guardar({ antecedentes: v || null })}
            className="sm:col-span-2"
          />
          <CampoEditable
            soloLectura={soloLectura}
            label="Información médica relevante"
            valor={paciente.informacion_medica}
            tipo="textarea"
            onGuardar={(v) => guardar({ informacion_medica: v || null })}
            className="sm:col-span-2"
          />
          <CampoEditable
            soloLectura={soloLectura}
            label="Notas generales"
            valor={paciente.notas_generales}
            tipo="textarea"
            onGuardar={(v) => guardar({ notas_generales: v || null })}
            className="sm:col-span-2"
          />
        </LudaCardContent>
      </LudaCard>

      {/* Línea de tiempo */}
      <LudaCard>
        <LudaCardHeader>
          <LudaCardTitle>Línea de tiempo</LudaCardTitle>
        </LudaCardHeader>
        <LudaCardContent>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-luda-lila" />
              <span className="text-luda-gris-light">Ingreso:</span>
              <span className="font-semibold text-luda-gris">
                {fechaLarga(paciente.fecha_ingreso)}
              </span>
            </li>
            {paciente.fecha_alta && (
              <li className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-gray-400" />
                <span className="text-luda-gris-light">Alta:</span>
                <span className="font-semibold text-luda-gris">
                  {fechaLarga(paciente.fecha_alta)}
                </span>
              </li>
            )}
          </ul>
        </LudaCardContent>
      </LudaCard>
    </div>
  );
}
