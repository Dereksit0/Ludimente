"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { Campo } from "@/components/pacientes/form-nuevo-paciente/campo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RedactarBoton } from "@/components/ui/redactar-boton";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useFormDraft } from "@/hooks/use-form-draft";
import { NIVELES_ESTUDIOS, PARENTESCOS } from "@/lib/catalogos";
import { tutorSchema, type TutorInput } from "@/lib/validations/paciente.schema";

interface TutorFormProps {
  inicial?: Partial<TutorInput>;
  pacienteId?: string;
  tutorId?: string;
  guardando: boolean;
  onGuardar: (valores: TutorInput) => void;
}

const vacio: TutorInput = {
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

export function TutorForm({
  inicial,
  pacienteId,
  tutorId,
  guardando,
  onGuardar,
}: TutorFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TutorInput>({
    resolver: zodResolver(tutorSchema),
    defaultValues: { ...vacio, ...inicial },
  });

  const { limpiar } = useFormDraft({
    clave: `draft:tutor:${pacienteId ?? "sin-paciente"}:${tutorId ?? "nuevo"}`,
    activo: true,
    watch,
    reset,
  });

  function submit(v: TutorInput) {
    limpiar();
    onGuardar(v);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo label="Nombre completo" requerido error={errors.nombre_completo?.message} className="sm:col-span-2">
          <Input {...register("nombre_completo")} />
        </Campo>
        <Campo label="Parentesco" requerido error={errors.parentesco?.message}>
          <Select {...register("parentesco")} defaultValue={inicial?.parentesco ?? ""}>
            <option value="">Selecciona…</option>
            {PARENTESCOS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </Campo>
        <Campo label="Teléfono principal" requerido error={errors.telefono_principal?.message}>
          <Input type="tel" {...register("telefono_principal")} />
        </Campo>
        <Campo label="Teléfono alternativo" error={errors.telefono_alternativo?.message}>
          <Input type="tel" {...register("telefono_alternativo")} />
        </Campo>
        <Campo label="Correo" error={errors.email?.message}>
          <Input type="email" {...register("email")} />
        </Campo>
        <Campo label="Ocupación">
          <Input {...register("ocupacion")} />
        </Campo>
        <Campo label="Nivel de estudios">
          <Select {...register("nivel_estudios")} defaultValue={inicial?.nivel_estudios ?? ""}>
            <option value="">Sin especificar</option>
            {NIVELES_ESTUDIOS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </Campo>
      </div>

      <Campo label="Notas">
        <Textarea {...register("notas")} />
        <RedactarBoton
          valor={watch("notas") ?? ""}
          contexto="Notas sobre un tutor/padre de familia en el expediente del paciente"
          onRedactado={(t) => setValue("notas", t, { shouldDirty: true })}
        />
      </Campo>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-luda-gris">
          <input type="checkbox" className="h-4 w-4 accent-luda-lila" {...register("es_contacto_principal")} />
          Contacto principal
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-luda-gris">
          <input type="checkbox" className="h-4 w-4 accent-luda-lila" {...register("vive_con_paciente")} />
          Vive con el paciente
        </label>
      </div>

      <Button type="submit" className="w-full" disabled={guardando}>
        {guardando ? (
          <>
            <Loader2 className="animate-spin" /> Guardando…
          </>
        ) : (
          "Guardar tutor"
        )}
      </Button>
    </form>
  );
}
