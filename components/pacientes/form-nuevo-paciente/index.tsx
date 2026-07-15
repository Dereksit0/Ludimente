"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { FormProvider, useForm, type FieldPath } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { LudaCard } from "@/components/ui/luda-card";
import { useFormDraft } from "@/hooks/use-form-draft";
import { useCrearPaciente } from "@/hooks/use-pacientes";
import { cn } from "@/lib/utils";
import {
  nuevoPacienteSchema,
  type NuevoPacienteInput,
} from "@/lib/validations/paciente.schema";

import { PasoAsignacion } from "./paso-asignacion";
import { PasoDatos } from "./paso-datos";
import { PasoMedica } from "./paso-medica";
import { PasoTutores } from "./paso-tutores";

const PASOS = [
  { titulo: "Datos del paciente", campos: [
    "nombre", "apellido_paterno", "apellido_materno", "fecha_nacimiento",
    "sexo", "escuela", "grado_escolar", "turno_escolar", "motivo_consulta",
  ] },
  { titulo: "Información médica", campos: [
    "diagnostico_principal", "diagnosticos_secundarios", "alergias",
    "medicamentos", "informacion_medica",
  ] },
  { titulo: "Tutores", campos: ["tutores"] },
  { titulo: "Asignación", campos: [
    "psicologo_asignado_id", "estatus", "fecha_ingreso", "notas_generales",
  ] },
] satisfies { titulo: string; campos: FieldPath<NuevoPacienteInput>[] }[];

const hoy = new Date().toISOString().slice(0, 10);

export function FormNuevoPaciente() {
  const router = useRouter();
  const crear = useCrearPaciente();
  const [paso, setPaso] = useState(0);

  const methods = useForm<NuevoPacienteInput>({
    resolver: zodResolver(nuevoPacienteSchema),
    mode: "onTouched",
    defaultValues: {
      nombre: "",
      apellido_paterno: "",
      apellido_materno: "",
      fecha_nacimiento: "",
      motivo_consulta: "",
      diagnostico_principal: "",
      diagnosticos_secundarios: [],
      alergias: "",
      medicamentos: "",
      informacion_medica: "",
      foto_url: "",
      psicologo_asignado_id: "",
      estatus: "lista_espera",
      fecha_ingreso: hoy,
      notas_generales: "",
      tutores: [
        {
          nombre_completo: "",
          parentesco: "",
          telefono_principal: "",
          telefono_alternativo: "",
          email: "",
          ocupacion: "",
          nivel_estudios: "",
          es_contacto_principal: true,
          vive_con_paciente: true,
          notas: "",
        },
      ],
    },
  });

  const esUltimo = paso === PASOS.length - 1;

  const { limpiar } = useFormDraft({
    clave: "draft:nuevo-paciente",
    activo: true,
    watch: methods.watch,
    reset: methods.reset,
  });

  async function siguiente() {
    const valido = await methods.trigger(PASOS[paso]!.campos);
    if (valido) setPaso((p) => Math.min(p + 1, PASOS.length - 1));
  }

  function onSubmit(datos: NuevoPacienteInput) {
    crear.mutate(datos, {
      onSuccess: (id) => {
        limpiar();
        toast.success("Paciente registrado ⭐");
        router.push(`/pacientes/${id}`);
      },
      onError: () => {
        toast.error("No se pudo registrar el paciente. Inténtalo de nuevo.");
      },
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-fredoka text-3xl text-luda-gris">Nuevo paciente 🐙</h1>
        <p className="mt-1 text-sm text-luda-gris-light">
          El número de expediente se genera automáticamente al guardar.
        </p>
      </div>

      {/* Indicador de pasos */}
      <ol className="flex items-center gap-2">
        {PASOS.map((p, i) => (
          <li key={p.titulo} className="flex flex-1 items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors",
                  i < paso && "bg-luda-lila text-white",
                  i === paso && "bg-luda-lila text-white ring-4 ring-luda-lila-light",
                  i > paso && "bg-luda-lila-light text-luda-gris-light",
                )}
              >
                {i < paso ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  "hidden text-sm font-semibold sm:inline",
                  i === paso ? "text-luda-gris" : "text-luda-gris-light",
                )}
              >
                {p.titulo}
              </span>
            </div>
            {i < PASOS.length - 1 && (
              <span className="h-0.5 flex-1 rounded bg-luda-lila-light" />
            )}
          </li>
        ))}
      </ol>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <LudaCard className="p-6">
            {paso === 0 && <PasoDatos />}
            {paso === 1 && <PasoMedica />}
            {paso === 2 && <PasoTutores />}
            {paso === 3 && <PasoAsignacion />}
          </LudaCard>

          <div className="mt-6 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPaso((p) => Math.max(p - 1, 0))}
              disabled={paso === 0}
            >
              <ArrowLeft /> Anterior
            </Button>

            {esUltimo ? (
              <Button type="submit" disabled={crear.isPending}>
                {crear.isPending ? (
                  <>
                    <Loader2 className="animate-spin" /> Guardando…
                  </>
                ) : (
                  <>
                    <Check /> Registrar paciente
                  </>
                )}
              </Button>
            ) : (
              <Button type="button" onClick={siguiente}>
                Siguiente <ArrowRight />
              </Button>
            )}
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
