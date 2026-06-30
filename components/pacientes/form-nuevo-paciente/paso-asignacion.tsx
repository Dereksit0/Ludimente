"use client";

import { useFormContext } from "react-hook-form";

import { Campo } from "@/components/pacientes/form-nuevo-paciente/campo";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { usePsicologos } from "@/hooks/use-perfiles";
import { ESTATUS_PACIENTE_OPCIONES } from "@/lib/catalogos";
import type { NuevoPacienteInput } from "@/lib/validations/paciente.schema";

export function PasoAsignacion() {
  const {
    register,
    formState: { errors },
  } = useFormContext<NuevoPacienteInput>();
  const { data: psicologos, isLoading } = usePsicologos();

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Campo label="Terapeuta asignado" htmlFor="psicologo_asignado_id">
          <Select
            id="psicologo_asignado_id"
            {...register("psicologo_asignado_id")}
            defaultValue=""
            disabled={isLoading}
          >
            <option value="">Sin asignar</option>
            {(psicologos ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </Select>
        </Campo>

        <Campo
          label="Estatus inicial"
          htmlFor="estatus"
          requerido
          error={errors.estatus?.message}
        >
          <Select id="estatus" {...register("estatus")}>
            {ESTATUS_PACIENTE_OPCIONES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Campo>

        <Campo
          label="Fecha de ingreso"
          htmlFor="fecha_ingreso"
          requerido
          error={errors.fecha_ingreso?.message}
        >
          <Input id="fecha_ingreso" type="date" {...register("fecha_ingreso")} />
        </Campo>
      </div>

      <Campo label="Notas generales" htmlFor="notas_generales">
        <Textarea
          id="notas_generales"
          placeholder="Observaciones iniciales, contexto, acuerdos…"
          {...register("notas_generales")}
        />
      </Campo>
    </div>
  );
}
