"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import {
  crearPlanDesdeSugerencia,
  sugerirPlanIntervencion,
  type InputSugerenciaPlan,
} from "@/app/(sistema)/pacientes/sugerencia-plan-actions";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { SugerenciaPlan } from "@/lib/ai/sugerencia-plan";
import {
  AREA_OBJETIVO_LABEL,
  PRIORIDAD_OBJETIVO_CLASES,
  PRIORIDAD_OBJETIVO_LABEL,
} from "@/types/app.types";

/** Botón que pide a la IA un borrador de plan de intervención y lo muestra en un modal. */
export function SugerenciaPlanBoton({
  datos,
  pacienteId,
  variant = "outline",
  size = "sm",
}: {
  datos: InputSugerenciaPlan;
  /** Si se pasa (paciente ya existe), permite crear el plan real con un clic. */
  pacienteId?: string;
  variant?: "outline" | "default" | "ghost";
  size?: "sm" | "default";
}) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [creando, setCreando] = useState(false);
  const [resultado, setResultado] = useState<SugerenciaPlan | null>(null);
  const [abierto, setAbierto] = useState(false);

  async function generar() {
    setCargando(true);
    const res = await sugerirPlanIntervencion(datos);
    setCargando(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setResultado(res.data);
    setAbierto(true);
  }

  async function crearPlan() {
    if (!pacienteId || !resultado) return;
    setCreando(true);
    const res = await crearPlanDesdeSugerencia(pacienteId, resultado);
    setCreando(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Plan creado a partir de la sugerencia");
    setAbierto(false);
    router.push(`/planes/${res.planId}`);
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={generar}
        disabled={cargando}
      >
        <Sparkles className="h-4 w-4" />
        {cargando ? "Generando sugerencia…" : "Sugerir plan con IA"}
      </Button>

      {resultado && (
        <Modal
          abierto={abierto}
          onCerrar={() => setAbierto(false)}
          titulo="Propuesta de plan de intervención"
          className="max-w-2xl"
        >
          <div className="space-y-4">
            <p className="rounded-lg bg-luda-lila-light/50 p-3 text-xs text-luda-gris-light">
              Propuesta generada por IA a partir de la información capturada.
              Es solo orientativa: revísala y ajústala antes de crear el plan
              real desde el módulo Planes.
            </p>

            <div>
              <h3 className="mb-2 text-sm font-bold text-luda-gris">
                Objetivos sugeridos
              </h3>
              <ul className="space-y-2">
                {resultado.objetivos.map((o, i) => (
                  <li
                    key={i}
                    className="flex items-start justify-between gap-2 rounded-lg border border-luda-lila/15 p-2.5"
                  >
                    <span className="text-sm text-luda-gris">
                      {o.descripcion}
                    </span>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="rounded-full border border-luda-lila/20 bg-luda-lila-light/60 px-2 py-0.5 text-[11px] font-semibold text-luda-lila-dark">
                        {AREA_OBJETIVO_LABEL[o.area]}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${PRIORIDAD_OBJETIVO_CLASES[o.prioridad]}`}
                      >
                        Prioridad {PRIORIDAD_OBJETIVO_LABEL[o.prioridad]}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Dato label="Sesiones sugeridas" valor={String(resultado.sesionesSugeridas)} />
              <Dato label="Frecuencia" valor={resultado.frecuenciaSemanal} />
              <Dato
                label="Duración estimada"
                valor={`${resultado.duracionEstimadaMeses} mes(es)`}
              />
              <Dato
                label="Precio estimado"
                valor={resultado.precioEstimado.toLocaleString("es-MX", {
                  style: "currency",
                  currency: "MXN",
                })}
              />
            </div>

            {resultado.paqueteRecomendado && (
              <p className="text-sm text-luda-gris">
                <span className="font-semibold">Paquete recomendado: </span>
                {resultado.paqueteRecomendado}
              </p>
            )}

            <div>
              <h3 className="mb-1 text-sm font-bold text-luda-gris">
                Justificación
              </h3>
              <p className="whitespace-pre-line text-sm text-luda-gris-light">
                {resultado.justificacion}
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setAbierto(false)}>
                Cerrar
              </Button>
              {pacienteId && (
                <Button type="button" onClick={crearPlan} disabled={creando}>
                  {creando ? "Creando plan…" : "Crear plan con esta propuesta"}
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="rounded-lg border border-luda-lila/15 p-2.5">
      <p className="text-[11px] uppercase tracking-wide text-luda-gris-light">
        {label}
      </p>
      <p className="text-sm font-bold text-luda-gris">{valor}</p>
    </div>
  );
}
