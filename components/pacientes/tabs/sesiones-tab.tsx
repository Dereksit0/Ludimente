"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FileEdit, Loader2, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Campo } from "@/components/pacientes/form-nuevo-paciente/campo";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { LudaCard } from "@/components/ui/luda-card";
import { Modal } from "@/components/ui/modal";
import { RedactarBoton } from "@/components/ui/redactar-boton";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useFormDraft } from "@/hooks/use-form-draft";
import { usePsicologos } from "@/hooks/use-perfiles";
import type { PacienteDetalle } from "@/hooks/use-pacientes";
import {
  useActualizarSesion,
  useCrearSesion,
  useEliminarSesion,
  useSesionesPaciente,
  type Sesion,
} from "@/hooks/use-sesiones";
import {
  AREA_TRABAJO_LABEL,
  AREA_TRABAJO_OPCIONES,
  HUMOR_LABEL,
  HUMOR_OPCIONES,
} from "@/lib/catalogos";
import { sesionSchema, type SesionInput } from "@/lib/validations/sesion.schema";

function sesionAInput(s: Sesion): Partial<SesionInput> {
  return {
    psicologo_id: s.psicologo_id,
    cita_id: s.cita_id ?? "",
    fecha_sesion: s.fecha_sesion,
    area_trabajo: s.area_trabajo ?? undefined,
    objetivos_sesion: s.objetivos_sesion,
    desarrollo_sesion: s.desarrollo_sesion,
    observaciones_conducta: s.observaciones_conducta ?? "",
    logros_sesion: s.logros_sesion ?? "",
    dificultades_encontradas: s.dificultades_encontradas ?? "",
    humor_paciente: s.humor_paciente ?? undefined,
    tuvo_desborde: s.tuvo_desborde ?? false,
    desborde_notas: s.desborde_notas ?? "",
    nivel_participacion: s.nivel_participacion ?? undefined,
    plan_siguiente_sesion: s.plan_siguiente_sesion ?? "",
    recomendaciones_casa: s.recomendaciones_casa ?? "",
    borrador: s.borrador,
  };
}

export function SesionForm({
  pacienteId,
  sesionId,
  psicologoSugerido,
  citaId,
  inicial,
  guardando,
  onGuardar,
}: {
  pacienteId: string;
  sesionId?: string;
  psicologoSugerido?: string;
  citaId?: string;
  inicial?: Partial<SesionInput>;
  guardando: boolean;
  onGuardar: (v: SesionInput) => void;
}) {
  const { data: psicologos = [] } = usePsicologos();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<SesionInput>({
    resolver: zodResolver(sesionSchema),
    defaultValues: {
      psicologo_id: inicial?.psicologo_id ?? psicologoSugerido ?? "",
      cita_id: inicial?.cita_id ?? citaId ?? "",
      fecha_sesion:
        inicial?.fecha_sesion ?? new Date().toISOString().slice(0, 10),
      area_trabajo: inicial?.area_trabajo,
      objetivos_sesion: inicial?.objetivos_sesion ?? "",
      desarrollo_sesion: inicial?.desarrollo_sesion ?? "",
      observaciones_conducta: inicial?.observaciones_conducta ?? "",
      logros_sesion: inicial?.logros_sesion ?? "",
      dificultades_encontradas: inicial?.dificultades_encontradas ?? "",
      humor_paciente: inicial?.humor_paciente,
      tuvo_desborde: inicial?.tuvo_desborde ?? false,
      desborde_notas: inicial?.desborde_notas ?? "",
      nivel_participacion: inicial?.nivel_participacion,
      plan_siguiente_sesion: inicial?.plan_siguiente_sesion ?? "",
      recomendaciones_casa: inicial?.recomendaciones_casa ?? "",
      borrador: inicial?.borrador ?? false,
    },
  });

  const tuvoDesborde = watch("tuvo_desborde");

  const { limpiar } = useFormDraft({
    clave: `draft:sesion:${pacienteId}:${sesionId ?? "nueva"}`,
    activo: true,
    watch,
    reset,
  });

  function submit(v: SesionInput) {
    limpiar();
    onGuardar(v);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <input type="hidden" {...register("cita_id")} />
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
        <Campo label="Fecha" requerido error={errors.fecha_sesion?.message}>
          <Input type="date" {...register("fecha_sesion")} />
        </Campo>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Campo label="Área de trabajo">
          <Select {...register("area_trabajo")}>
            <option value="">Sin especificar</option>
            {AREA_TRABAJO_OPCIONES.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </Select>
        </Campo>
        <Campo label="Humor del paciente">
          <Select {...register("humor_paciente")}>
            <option value="">Sin especificar</option>
            {HUMOR_OPCIONES.map((h) => (
              <option key={h.value} value={h.value}>
                {h.label}
              </option>
            ))}
          </Select>
        </Campo>
        <Campo label="Participación (1-5)">
          <Input
            type="number"
            min={1}
            max={5}
            {...register("nivel_participacion")}
          />
        </Campo>
      </div>

      <div className="rounded-xl border border-luda-lila/20 bg-luda-lila-light/30 p-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-luda-gris">
          <input
            type="checkbox"
            className="h-4 w-4 accent-luda-lila"
            {...register("tuvo_desborde")}
          />
          ⚡ ¿El paciente tuvo un desborde emocional?
        </label>
        {tuvoDesborde && (
          <div className="mt-2">
            <Textarea
              placeholder="¿Qué lo desencadenó, cómo se manifestó y cómo se regresó a la calma?"
              {...register("desborde_notas")}
            />
            <RedactarBoton
              valor={watch("desborde_notas") ?? ""}
              contexto="Nota de sesión clínica: descripción de un desborde emocional"
              onRedactado={(t) => setValue("desborde_notas", t, { shouldDirty: true })}
            />
          </div>
        )}
      </div>

      <Campo label="Objetivos de la sesión" requerido error={errors.objetivos_sesion?.message}>
        <Textarea {...register("objetivos_sesion")} />
        <RedactarBoton
          valor={watch("objetivos_sesion") ?? ""}
          contexto="Nota de sesión clínica: objetivos de la sesión"
          onRedactado={(t) => setValue("objetivos_sesion", t, { shouldDirty: true })}
        />
      </Campo>
      <Campo label="Desarrollo de la sesión" requerido error={errors.desarrollo_sesion?.message}>
        <Textarea {...register("desarrollo_sesion")} />
        <RedactarBoton
          valor={watch("desarrollo_sesion") ?? ""}
          contexto="Nota de sesión clínica: desarrollo de la sesión"
          onRedactado={(t) => setValue("desarrollo_sesion", t, { shouldDirty: true })}
        />
      </Campo>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo label="Logros">
          <Textarea {...register("logros_sesion")} />
          <RedactarBoton
            valor={watch("logros_sesion") ?? ""}
            contexto="Nota de sesión clínica: logros del paciente"
            onRedactado={(t) => setValue("logros_sesion", t, { shouldDirty: true })}
          />
        </Campo>
        <Campo label="Aspectos a fortalecer">
          <Textarea {...register("dificultades_encontradas")} />
          <RedactarBoton
            valor={watch("dificultades_encontradas") ?? ""}
            contexto="Nota de sesión clínica: aspectos a fortalecer del paciente"
            onRedactado={(t) => setValue("dificultades_encontradas", t, { shouldDirty: true })}
          />
        </Campo>
      </div>

      <Campo label="Observaciones de conducta">
        <Textarea {...register("observaciones_conducta")} />
        <RedactarBoton
          valor={watch("observaciones_conducta") ?? ""}
          contexto="Nota de sesión clínica: observaciones de conducta"
          onRedactado={(t) => setValue("observaciones_conducta", t, { shouldDirty: true })}
        />
      </Campo>
      <Campo label="Plan para la siguiente sesión">
        <Textarea {...register("plan_siguiente_sesion")} />
        <RedactarBoton
          valor={watch("plan_siguiente_sesion") ?? ""}
          contexto="Nota de sesión clínica: plan para la siguiente sesión"
          onRedactado={(t) => setValue("plan_siguiente_sesion", t, { shouldDirty: true })}
        />
      </Campo>
      <Campo label="Recomendaciones para casa (visible en el portal de padres)">
        <Textarea {...register("recomendaciones_casa")} />
        <RedactarBoton
          valor={watch("recomendaciones_casa") ?? ""}
          contexto="Recomendaciones para casa dirigidas a los padres, tono cercano y profesional"
          onRedactado={(t) => setValue("recomendaciones_casa", t, { shouldDirty: true })}
        />
      </Campo>

      <label className="flex items-center gap-2 text-sm font-semibold text-luda-gris">
        <input type="checkbox" className="h-4 w-4 accent-luda-lila" {...register("borrador")} />
        Guardar como borrador (no se muestra a los padres)
      </label>

      <Button type="submit" className="w-full" disabled={guardando}>
        {guardando ? (
          <>
            <Loader2 className="animate-spin" /> Guardando…
          </>
        ) : (
          "Guardar nota"
        )}
      </Button>
    </form>
  );
}

export function SesionesTab({ paciente }: { paciente: PacienteDetalle }) {
  const { data: sesiones = [], isLoading } = useSesionesPaciente(paciente.id);
  const crear = useCrearSesion(paciente.id);
  const actualizar = useActualizarSesion(paciente.id);
  const eliminar = useEliminarSesion(paciente.id);
  const confirmar = useConfirm();
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<Sesion | null>(null);

  async function guardar(v: SesionInput) {
    try {
      if (editando) {
        await actualizar.mutateAsync({ id: editando.id, input: v });
        toast.success("Nota actualizada");
      } else {
        await crear.mutateAsync(v);
        toast.success("Nota guardada");
      }
      setAbierto(false);
      setEditando(null);
    } catch {
      toast.error("No se pudo guardar la nota");
    }
  }

  async function borrar(s: Sesion) {
    const ok = await confirmar({
      titulo: "Eliminar nota de sesión",
      mensaje: "¿Eliminar esta nota de sesión?",
      confirmar: "Eliminar",
      peligro: true,
    });
    if (!ok) return;
    await eliminar.mutateAsync(s.id);
    toast.success("Nota eliminada");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-luda-gris">Notas de sesión</h3>
        <Button
          size="sm"
          onClick={() => {
            setEditando(null);
            setAbierto(true);
          }}
        >
          <Plus className="h-4 w-4" /> Nueva nota
        </Button>
      </div>

      {isLoading && <p className="text-sm text-luda-gris-light">Cargando…</p>}
      {!isLoading && sesiones.length === 0 && (
        <LudaCard className="p-6">
          <p className="text-sm text-luda-gris-light">
            Aún no hay notas de sesión.
          </p>
        </LudaCard>
      )}

      <div className="space-y-2">
        {sesiones.map((s) => (
          <LudaCard key={s.id} className="flex items-start gap-3 p-4">
            <div className="flex-1">
              <p className="flex items-center gap-2 text-sm font-bold text-luda-gris">
                Sesión #{s.numero_sesion}
                <span className="font-normal capitalize text-luda-gris-light">
                  · {format(new Date(s.fecha_sesion), "d 'de' MMM yyyy", { locale: es })}
                </span>
                {s.borrador && (
                  <span className="rounded-full bg-yellow-50 px-2 py-0.5 text-[10px] font-semibold text-yellow-700">
                    Borrador
                  </span>
                )}
              </p>
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-luda-gris-light">
                <span>
                  {s.area_trabajo ? AREA_TRABAJO_LABEL[s.area_trabajo] : "Sin área"}
                </span>
                {s.humor_paciente && (
                  <span className="rounded-full bg-luda-lila-light px-2 py-0.5 font-semibold text-luda-lila-dark">
                    {HUMOR_LABEL[s.humor_paciente] ?? s.humor_paciente}
                  </span>
                )}
                {s.tuvo_desborde && (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 font-semibold text-red-600">
                    ⚡ Desborde
                  </span>
                )}
              </p>
              {s.logros_sesion && (
                <p className="mt-1 line-clamp-2 text-sm text-luda-gris">
                  {s.logros_sesion}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setEditando(s);
                setAbierto(true);
              }}
              aria-label="Editar nota"
              className="rounded-lg p-2 text-luda-gris-light hover:bg-luda-lila-light hover:text-luda-lila-dark"
            >
              <FileEdit className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => borrar(s)}
              aria-label="Eliminar nota"
              className="rounded-lg p-2 text-luda-gris-light hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </LudaCard>
        ))}
      </div>

      <Modal
        abierto={abierto}
        onCerrar={() => {
          setAbierto(false);
          setEditando(null);
        }}
        titulo={editando ? `Editar sesión #${editando.numero_sesion}` : "Nueva nota de sesión"}
        className="max-w-2xl"
      >
        <SesionForm
          pacienteId={paciente.id}
          sesionId={editando?.id}
          psicologoSugerido={paciente.psicologo_asignado_id ?? undefined}
          inicial={editando ? sesionAInput(editando) : undefined}
          guardando={crear.isPending || actualizar.isPending}
          onGuardar={guardar}
        />
      </Modal>
    </div>
  );
}
