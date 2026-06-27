"use client";

import { useState } from "react";

import { Controller, useFormContext } from "react-hook-form";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Campo } from "@/components/pacientes/form-nuevo-paciente/campo";
import { Input } from "@/components/ui/input";
import { LudaAvatar } from "@/components/ui/luda-avatar";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { GRADOS_ESCOLARES, SEXO_OPCIONES, TURNO_OPCIONES } from "@/lib/catalogos";
import { BUCKET_FOTOS, subirArchivo } from "@/lib/storage";
import type { NuevoPacienteInput } from "@/lib/validations/paciente.schema";

export function PasoDatos() {
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<NuevoPacienteInput>();
  const [subiendo, setSubiendo] = useState(false);
  const [previewNombre, setPreviewNombre] = useState("");

  async function onFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendo(true);
    try {
      const path = `tmp/${crypto.randomUUID()}-${file.name}`;
      await subirArchivo(BUCKET_FOTOS, path, file);
      setValue("foto_url", path, { shouldDirty: true });
      setPreviewNombre(file.name);
      toast.success("Foto cargada ⭐");
    } catch {
      toast.error("No se pudo subir la foto. Puedes continuar sin ella.");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Campo label="Nombre(s)" htmlFor="nombre" requerido error={errors.nombre?.message}>
          <Input id="nombre" {...register("nombre")} />
        </Campo>
        <Campo
          label="Apellido paterno"
          htmlFor="apellido_paterno"
          requerido
          error={errors.apellido_paterno?.message}
        >
          <Input id="apellido_paterno" {...register("apellido_paterno")} />
        </Campo>
        <Campo
          label="Apellido materno"
          htmlFor="apellido_materno"
          error={errors.apellido_materno?.message}
        >
          <Input id="apellido_materno" {...register("apellido_materno")} />
        </Campo>
        <Campo
          label="Fecha de nacimiento"
          htmlFor="fecha_nacimiento"
          requerido
          error={errors.fecha_nacimiento?.message}
        >
          <Input id="fecha_nacimiento" type="date" {...register("fecha_nacimiento")} />
        </Campo>
        <Campo label="Sexo" htmlFor="sexo" error={errors.sexo?.message}>
          <Select id="sexo" {...register("sexo")} defaultValue="">
            <option value="">Sin especificar</option>
            {SEXO_OPCIONES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Campo>

        {/* Foto */}
        <Campo label="Foto (opcional)">
          <div className="flex items-center gap-3">
            <LudaAvatar nombre={previewNombre || "Foto"} foto={null} size={48} />
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-luda-lila/40 bg-white px-3 py-2 text-sm font-semibold text-luda-gris hover:bg-luda-lila-light">
              {subiendo ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
              {subiendo ? "Subiendo…" : "Subir foto"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFoto}
                disabled={subiendo}
              />
            </label>
          </div>
        </Campo>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Campo label="Escuela" htmlFor="escuela" error={errors.escuela?.message}>
          <Input id="escuela" {...register("escuela")} />
        </Campo>
        <Campo label="Grado escolar" htmlFor="grado_escolar">
          <Select id="grado_escolar" {...register("grado_escolar")} defaultValue="">
            <option value="">Sin especificar</option>
            {GRADOS_ESCOLARES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        </Campo>
        <Campo label="Turno" htmlFor="turno_escolar">
          <Select id="turno_escolar" {...register("turno_escolar")} defaultValue="">
            <option value="">Sin especificar</option>
            {TURNO_OPCIONES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Campo>
      </div>

      <Campo
        label="Motivo de consulta"
        htmlFor="motivo_consulta"
        requerido
        error={errors.motivo_consulta?.message}
      >
        <Controller
          control={control}
          name="motivo_consulta"
          render={({ field }) => (
            <Textarea
              id="motivo_consulta"
              placeholder="¿Qué motiva la consulta? Describe brevemente la situación."
              {...field}
            />
          )}
        />
      </Campo>
    </div>
  );
}
