"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { Campo } from "@/components/pacientes/form-nuevo-paciente/campo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { usePacientes } from "@/hooks/use-pacientes";
import { usePsicologos } from "@/hooks/use-perfiles";
import {
  DURACION_OPCIONES,
  MODALIDAD_OPCIONES,
  TIPO_CITA_OPCIONES,
} from "@/lib/catalogos";
import { citaSchema, type CitaInput } from "@/lib/validations/cita.schema";

interface CitaFormProps {
  inicial?: Partial<CitaInput>;
  pacienteFijo?: string; // si se abre desde un expediente
  guardando: boolean;
  onGuardar: (valores: CitaInput) => void;
}

export function CitaForm({
  inicial,
  pacienteFijo,
  guardando,
  onGuardar,
}: CitaFormProps) {
  const { data: pacientes = [] } = usePacientes();
  const { data: psicologos = [] } = usePsicologos();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CitaInput>({
    resolver: zodResolver(citaSchema),
    defaultValues: {
      paciente_id: pacienteFijo ?? inicial?.paciente_id ?? "",
      psicologo_id: inicial?.psicologo_id ?? "",
      fecha: inicial?.fecha ?? "",
      hora: inicial?.hora ?? "09:00",
      duracion_min: inicial?.duracion_min ?? 50,
      tipo: inicial?.tipo ?? "sesion_intervencion",
      modalidad: inicial?.modalidad ?? "presencial",
      notas_previas: inicial?.notas_previas ?? "",
    },
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Campo label="Fecha" requerido error={errors.fecha?.message}>
          <Input type="date" {...register("fecha")} />
        </Campo>
        <Campo label="Hora" requerido error={errors.hora?.message}>
          <Input type="time" {...register("hora")} />
        </Campo>
        <Campo label="Duración" error={errors.duracion_min?.message}>
          <Select {...register("duracion_min")}>
            {DURACION_OPCIONES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </Select>
        </Campo>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo label="Tipo de cita" requerido error={errors.tipo?.message}>
          <Select {...register("tipo")}>
            {TIPO_CITA_OPCIONES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </Campo>
        <Campo label="Modalidad" error={errors.modalidad?.message}>
          <Select {...register("modalidad")}>
            {MODALIDAD_OPCIONES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
        </Campo>
      </div>

      <Campo label="Notas previas">
        <Textarea
          {...register("notas_previas")}
          placeholder="Indicaciones, material a preparar…"
        />
      </Campo>

      <Button type="submit" className="w-full" disabled={guardando}>
        {guardando ? (
          <>
            <Loader2 className="animate-spin" /> Guardando…
          </>
        ) : (
          "Guardar cita"
        )}
      </Button>
    </form>
  );
}
