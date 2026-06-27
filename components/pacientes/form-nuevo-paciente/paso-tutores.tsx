"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Star, Trash2 } from "lucide-react";

import { Campo } from "@/components/pacientes/form-nuevo-paciente/campo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LudaCard } from "@/components/ui/luda-card";
import { Select } from "@/components/ui/select";
import { NIVELES_ESTUDIOS, PARENTESCOS } from "@/lib/catalogos";
import { cn } from "@/lib/utils";
import type { NuevoPacienteInput } from "@/lib/validations/paciente.schema";

const tutorVacio = {
  nombre_completo: "",
  parentesco: "",
  telefono_principal: "",
  telefono_alternativo: "",
  email: "",
  ocupacion: "",
  nivel_estudios: "",
  es_contacto_principal: false,
  vive_con_paciente: true,
  notas: "",
};

export function PasoTutores() {
  const {
    register,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<NuevoPacienteInput>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "tutores",
  });

  const tutores = watch("tutores");

  function marcarPrincipal(index: number) {
    fields.forEach((_, i) => {
      setValue(`tutores.${i}.es_contacto_principal`, i === index, {
        shouldDirty: true,
      });
    });
  }

  return (
    <div className="space-y-4">
      {typeof errors.tutores?.message === "string" && (
        <p className="text-xs font-semibold text-red-500">
          {errors.tutores.message}
        </p>
      )}

      {fields.map((field, index) => {
        const esPrincipal = tutores?.[index]?.es_contacto_principal;
        const errTutor = errors.tutores?.[index];
        return (
          <LudaCard key={field.id} className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => marcarPrincipal(index)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-colors",
                  esPrincipal
                    ? "bg-luda-amarillo-light text-yellow-700"
                    : "bg-luda-lila-light/60 text-luda-gris-light hover:text-luda-gris",
                )}
              >
                <Star
                  className={cn("h-3.5 w-3.5", esPrincipal && "fill-luda-amarillo")}
                />
                {esPrincipal ? "Contacto principal" : "Marcar como principal"}
              </button>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label="Quitar tutor"
                  className="rounded-lg p-1.5 text-luda-gris-light hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Campo
                label="Nombre completo"
                requerido
                error={errTutor?.nombre_completo?.message}
              >
                <Input {...register(`tutores.${index}.nombre_completo`)} />
              </Campo>
              <Campo
                label="Parentesco"
                requerido
                error={errTutor?.parentesco?.message}
              >
                <Select {...register(`tutores.${index}.parentesco`)} defaultValue="">
                  <option value="">Selecciona…</option>
                  {PARENTESCOS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Select>
              </Campo>
              <Campo
                label="Teléfono principal"
                requerido
                error={errTutor?.telefono_principal?.message}
              >
                <Input
                  type="tel"
                  placeholder="10 dígitos"
                  {...register(`tutores.${index}.telefono_principal`)}
                />
              </Campo>
              <Campo
                label="Teléfono alternativo"
                error={errTutor?.telefono_alternativo?.message}
              >
                <Input type="tel" {...register(`tutores.${index}.telefono_alternativo`)} />
              </Campo>
              <Campo label="Correo" error={errTutor?.email?.message}>
                <Input type="email" {...register(`tutores.${index}.email`)} />
              </Campo>
              <Campo label="Ocupación">
                <Input {...register(`tutores.${index}.ocupacion`)} />
              </Campo>
              <Campo label="Nivel de estudios">
                <Select
                  {...register(`tutores.${index}.nivel_estudios`)}
                  defaultValue=""
                >
                  <option value="">Sin especificar</option>
                  {NIVELES_ESTUDIOS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              </Campo>
              <label className="flex items-center gap-2 self-end pb-2.5 text-sm font-semibold text-luda-gris">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-luda-lila"
                  {...register(`tutores.${index}.vive_con_paciente`)}
                />
                Vive con el paciente
              </label>
            </div>
          </LudaCard>
        );
      })}

      {fields.length < 4 && (
        <Button
          type="button"
          variant="outline"
          onClick={() => append(tutorVacio)}
          className="w-full"
        >
          <Plus /> Agregar otro tutor
        </Button>
      )}
    </div>
  );
}
