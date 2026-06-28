"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { Controller, useFieldArray, useForm } from "react-hook-form";

import { sugerirInterpretacion } from "@/lib/interpretacion";

import { Campo } from "@/components/pacientes/form-nuevo-paciente/campo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TagsInput } from "@/components/ui/tags-input";
import { Textarea } from "@/components/ui/textarea";
import { usePacientes } from "@/hooks/use-pacientes";
import { usePsicologos } from "@/hooks/use-perfiles";
import {
  ESTATUS_EVALUACION_OPCIONES,
  FORTALEZAS_SUGERIDAS,
  TIPO_PRUEBA_OPCIONES,
} from "@/lib/catalogos";
import {
  evaluacionSchema,
  type EvaluacionInput,
} from "@/lib/validations/evaluacion.schema";

interface Props {
  inicial?: Partial<EvaluacionInput>;
  pacienteFijo?: string;
  psicologoSugerido?: string;
  guardando: boolean;
  onGuardar: (v: EvaluacionInput) => void;
}

export function EvaluacionForm({
  inicial,
  pacienteFijo,
  psicologoSugerido,
  guardando,
  onGuardar,
}: Props) {
  const { data: pacientes = [] } = usePacientes();
  const { data: psicologos = [] } = usePsicologos();

  const {
    register,
    control,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<EvaluacionInput>({
    resolver: zodResolver(evaluacionSchema),
    defaultValues: {
      paciente_id: pacienteFijo ?? inicial?.paciente_id ?? "",
      psicologo_id: inicial?.psicologo_id ?? psicologoSugerido ?? "",
      tipo_prueba: inicial?.tipo_prueba ?? "WISC-V",
      nombre_personalizado: inicial?.nombre_personalizado ?? "",
      fecha_aplicacion:
        inicial?.fecha_aplicacion ?? new Date().toISOString().slice(0, 10),
      fecha_calificacion: inicial?.fecha_calificacion ?? "",
      fecha_entrega: inicial?.fecha_entrega ?? "",
      ci_total: inicial?.ci_total,
      interpretacion_cualitativa: inicial?.interpretacion_cualitativa ?? "",
      fortalezas: inicial?.fortalezas ?? [],
      areas_oportunidad: inicial?.areas_oportunidad ?? [],
      recomendaciones: inicial?.recomendaciones ?? "",
      estatus: inicial?.estatus ?? "en_proceso",
      subpruebas: inicial?.subpruebas ?? [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "subpruebas",
  });

  return (
    <form onSubmit={handleSubmit(onGuardar)} className="space-y-4">
      {!pacienteFijo && (
        <Campo label="Paciente" requerido error={errors.paciente_id?.message}>
          <Select {...register("paciente_id")}>
            <option value="">Selecciona…</option>
            {pacientes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} {p.apellido_paterno} · {p.numero_expediente}
              </option>
            ))}
          </Select>
        </Campo>
      )}
      {pacienteFijo && (
        <input type="hidden" {...register("paciente_id")} value={pacienteFijo} />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo label="Terapeuta" requerido error={errors.psicologo_id?.message}>
          <Select {...register("psicologo_id")}>
            <option value="">Selecciona…</option>
            {psicologos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </Select>
        </Campo>
        <Campo label="Instrumento" requerido error={errors.tipo_prueba?.message}>
          <Select {...register("tipo_prueba")}>
            {TIPO_PRUEBA_OPCIONES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </Campo>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Campo label="Fecha de aplicación" requerido error={errors.fecha_aplicacion?.message}>
          <Input type="date" {...register("fecha_aplicacion")} />
        </Campo>
        <Campo label="Fecha de calificación">
          <Input type="date" {...register("fecha_calificacion")} />
        </Campo>
        <Campo label="Fecha de entrega">
          <Input type="date" {...register("fecha_entrega")} />
        </Campo>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo label="CI total (si aplica)">
          <Input type="number" {...register("ci_total")} />
        </Campo>
        <Campo label="Estatus">
          <Select {...register("estatus")}>
            {ESTATUS_EVALUACION_OPCIONES.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </Select>
        </Campo>
      </div>

      {/* Subpruebas */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-luda-gris">Subpruebas</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              append({
                nombre_subprueba: "",
                puntuacion_directa: undefined,
                puntuacion_escalar: undefined,
                percentil: undefined,
                categoria: "",
              })
            }
          >
            <Plus className="h-4 w-4" /> Agregar
          </Button>
        </div>
        {fields.map((f, i) => (
          <div key={f.id} className="flex flex-wrap items-end gap-2 rounded-xl bg-luda-fondo p-3">
            <div className="min-w-[140px] flex-1">
              <label className="text-[11px] font-semibold text-luda-gris-light">Subprueba</label>
              <Input {...register(`subpruebas.${i}.nombre_subprueba`)} className="h-9" />
            </div>
            <div className="w-20">
              <label className="text-[11px] font-semibold text-luda-gris-light">P. directa</label>
              <Input type="number" {...register(`subpruebas.${i}.puntuacion_directa`)} className="h-9" />
            </div>
            <div className="w-20">
              <label className="text-[11px] font-semibold text-luda-gris-light">Escalar</label>
              <Input type="number" {...register(`subpruebas.${i}.puntuacion_escalar`)} className="h-9" />
            </div>
            <div className="w-20">
              <label className="text-[11px] font-semibold text-luda-gris-light">Percentil</label>
              <Input type="number" {...register(`subpruebas.${i}.percentil`)} className="h-9" />
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label="Quitar subprueba"
              className="rounded-lg p-2 text-luda-gris-light hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <Campo label="Fortalezas">
        <Controller
          control={control}
          name="fortalezas"
          render={({ field }) => (
            <TagsInput
              value={field.value}
              onChange={field.onChange}
              sugerencias={FORTALEZAS_SUGERIDAS}
              placeholder="Agrega una fortaleza…"
            />
          )}
        />
      </Campo>
      <Campo label="Áreas de oportunidad">
        <Controller
          control={control}
          name="areas_oportunidad"
          render={({ field }) => (
            <TagsInput
              value={field.value}
              onChange={field.onChange}
              placeholder="Agrega un área…"
            />
          )}
        />
      </Campo>

      <Campo label="Interpretación cualitativa">
        <div className="mb-1.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              setValue(
                "interpretacion_cualitativa",
                sugerirInterpretacion(getValues("subpruebas"), getValues("ci_total")),
                { shouldDirty: true },
              )
            }
          >
            <Sparkles className="h-4 w-4" /> Sugerir interpretación
          </Button>
        </div>
        <Textarea {...register("interpretacion_cualitativa")} rows={4} />
      </Campo>
      <Campo label="Recomendaciones">
        <Textarea {...register("recomendaciones")} rows={3} />
      </Campo>

      <Button type="submit" className="w-full" disabled={guardando}>
        {guardando ? (
          <>
            <Loader2 className="animate-spin" /> Guardando…
          </>
        ) : (
          "Guardar evaluación"
        )}
      </Button>
    </form>
  );
}
