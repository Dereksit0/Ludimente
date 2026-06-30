"use client";

import { Controller, useFormContext } from "react-hook-form";

import { Campo } from "@/components/pacientes/form-nuevo-paciente/campo";
import { Input } from "@/components/ui/input";
import { TagsInput } from "@/components/ui/tags-input";
import { Textarea } from "@/components/ui/textarea";
import { DIAGNOSTICOS_COMUNES } from "@/lib/catalogos";
import type { NuevoPacienteInput } from "@/lib/validations/paciente.schema";

const NO_APLICA = "No aplica";

/** Botón rápido para marcar un campo como "No aplica" / "No tiene". */
function BotonNoAplica({
  activo,
  onClick,
}: {
  activo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mb-1.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${
        activo
          ? "bg-luda-lila text-white"
          : "bg-luda-lila-light text-luda-lila-dark hover:bg-luda-lila/30"
      }`}
    >
      {activo ? "✓ No aplica / no tiene" : "No aplica / no tiene"}
    </button>
  );
}

export function PasoMedica() {
  const { register, control, setValue, watch } = useFormContext<NuevoPacienteInput>();

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
          <BotonNoAplica
            activo={watch("alergias") === NO_APLICA}
            onClick={() =>
              setValue(
                "alergias",
                watch("alergias") === NO_APLICA ? "" : NO_APLICA,
                { shouldDirty: true },
              )
            }
          />
          <Textarea id="alergias" {...register("alergias")} />
        </Campo>
        <Campo label="Medicamentos actuales" htmlFor="medicamentos">
          <BotonNoAplica
            activo={watch("medicamentos") === NO_APLICA}
            onClick={() =>
              setValue(
                "medicamentos",
                watch("medicamentos") === NO_APLICA ? "" : NO_APLICA,
                { shouldDirty: true },
              )
            }
          />
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
