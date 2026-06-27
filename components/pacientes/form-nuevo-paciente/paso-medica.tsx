"use client";

import { Controller, useFormContext } from "react-hook-form";

import { Campo } from "@/components/pacientes/form-nuevo-paciente/campo";
import { Input } from "@/components/ui/input";
import { TagsInput } from "@/components/ui/tags-input";
import { Textarea } from "@/components/ui/textarea";
import { DIAGNOSTICOS_COMUNES } from "@/lib/catalogos";
import type { NuevoPacienteInput } from "@/lib/validations/paciente.schema";

export function PasoMedica() {
  const { register, control } = useFormContext<NuevoPacienteInput>();

  return (
    <div className="space-y-5">
      <Campo label="Diagnóstico principal" htmlFor="diagnostico_principal">
        <Input
          id="diagnostico_principal"
          list="diagnosticos-comunes"
          placeholder="Selecciona o escribe libremente"
          {...register("diagnostico_principal")}
        />
        <datalist id="diagnosticos-comunes">
          {DIAGNOSTICOS_COMUNES.map((d) => (
            <option key={d} value={d} />
          ))}
        </datalist>
      </Campo>

      <Campo label="Diagnósticos secundarios">
        <Controller
          control={control}
          name="diagnosticos_secundarios"
          render={({ field }) => (
            <TagsInput
              value={field.value ?? []}
              onChange={field.onChange}
              sugerencias={DIAGNOSTICOS_COMUNES}
              placeholder="Agrega diagnósticos y presiona Enter"
            />
          )}
        />
      </Campo>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Campo label="Alergias" htmlFor="alergias">
          <Textarea id="alergias" {...register("alergias")} />
        </Campo>
        <Campo label="Medicamentos actuales" htmlFor="medicamentos">
          <Textarea id="medicamentos" {...register("medicamentos")} />
        </Campo>
      </div>

      <Campo label="Información médica relevante" htmlFor="informacion_medica">
        <Textarea
          id="informacion_medica"
          placeholder="Antecedentes, condiciones a considerar, etc."
          {...register("informacion_medica")}
        />
      </Campo>
    </div>
  );
}
