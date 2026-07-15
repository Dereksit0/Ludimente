"use client";

import { Controller, useFormContext } from "react-hook-form";

import { Campo } from "@/components/pacientes/form-nuevo-paciente/campo";
import { Input } from "@/components/ui/input";
import { RedactarBoton } from "@/components/ui/redactar-boton";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { GRADOS_ESCOLARES, SEXO_OPCIONES, TURNO_OPCIONES } from "@/lib/catalogos";
import type { NuevoPacienteInput } from "@/lib/validations/paciente.schema";

export function PasoDatos() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<NuevoPacienteInput>();

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
            <>
              <Textarea
                id="motivo_consulta"
                placeholder="¿Qué motiva la consulta? Describe brevemente la situación."
                {...field}
              />
              <RedactarBoton
                valor={field.value ?? ""}
                contexto="Motivo de consulta al registrar un nuevo paciente"
                onRedactado={field.onChange}
              />
            </>
          )}
        />
      </Campo>
    </div>
  );
}
