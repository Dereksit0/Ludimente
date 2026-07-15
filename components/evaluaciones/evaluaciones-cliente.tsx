"use client";

import { useState } from "react";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ClipboardList, FileEdit, Plus, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { EvaluacionForm } from "@/components/evaluaciones/evaluacion-form";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { LudaCard } from "@/components/ui/luda-card";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useConfiguracion } from "@/hooks/use-configuracion";
import { createClient } from "@/lib/supabase/client";
import {
  useCrearEvaluacion,
  useActualizarEvaluacion,
  useEliminarEvaluacion,
  useEvaluaciones,
  type Evaluacion,
  type EvaluacionDetalle,
} from "@/hooks/use-evaluaciones";
import {
  ESTATUS_EVALUACION_LABEL,
  ESTATUS_EVALUACION_OPCIONES,
  TIPO_PRUEBA_OPCIONES,
} from "@/lib/catalogos";
import { imprimirEvaluacion } from "@/lib/print-evaluacion";
import type { EvaluacionInput } from "@/lib/validations/evaluacion.schema";

const tipoLabel = (v: string) =>
  TIPO_PRUEBA_OPCIONES.find((t) => t.value === v)?.label ?? v;

async function cargarDetalle(id: string): Promise<EvaluacionDetalle> {
  const supabase = createClient();
  const { data: ev } = await supabase
    .from("evaluaciones")
    .select("*")
    .eq("id", id)
    .single();
  const { data: subpruebas } = await supabase
    .from("evaluacion_subpruebas")
    .select("*")
    .eq("evaluacion_id", id);
  return { ...(ev as Evaluacion), subpruebas: subpruebas ?? [] };
}

function detalleAInput(d: EvaluacionDetalle): Partial<EvaluacionInput> {
  return {
    paciente_id: d.paciente_id,
    psicologo_id: d.psicologo_id,
    tipo_prueba: d.tipo_prueba,
    nombre_personalizado: d.nombre_personalizado ?? "",
    fecha_aplicacion: d.fecha_aplicacion,
    fecha_calificacion: d.fecha_calificacion ?? "",
    fecha_entrega: d.fecha_entrega ?? "",
    ci_total: d.ci_total ?? undefined,
    interpretacion_cualitativa: d.interpretacion_cualitativa ?? "",
    fortalezas: d.fortalezas ?? [],
    areas_oportunidad: d.areas_oportunidad ?? [],
    recomendaciones: d.recomendaciones ?? "",
    estatus: d.estatus,
    subpruebas: d.subpruebas.map((s) => ({
      nombre_subprueba: s.nombre_subprueba,
      puntuacion_directa: s.puntuacion_directa ?? undefined,
      puntuacion_escalar: s.puntuacion_escalar ?? undefined,
      percentil: s.percentil ?? undefined,
      categoria: s.categoria ?? "",
    })),
  };
}

export function EvaluacionesCliente() {
  const { data: evals = [], isLoading, isError } = useEvaluaciones();
  const crear = useCrearEvaluacion();
  const actualizar = useActualizarEvaluacion();
  const eliminar = useEliminarEvaluacion();
  const { data: config } = useConfiguracion();
  const confirmar = useConfirm();

  const [filtro, setFiltro] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [inicial, setInicial] = useState<Partial<EvaluacionInput> | undefined>();

  const visibles = filtro ? evals.filter((e) => e.estatus === filtro) : evals;

  async function nuevo() {
    setEditId(null);
    setInicial(undefined);
    setAbierto(true);
  }

  async function editar(id: string) {
    const d = await cargarDetalle(id);
    setEditId(id);
    setInicial(detalleAInput(d));
    setAbierto(true);
  }

  async function guardar(v: EvaluacionInput) {
    try {
      if (editId) {
        await actualizar.mutateAsync({ id: editId, input: v });
        toast.success("Evaluación actualizada");
      } else {
        await crear.mutateAsync(v);
        toast.success("Evaluación creada");
      }
      setAbierto(false);
    } catch {
      toast.error("No se pudo guardar la evaluación");
    }
  }

  async function imprimir(id: string, nombre: string) {
    const d = await cargarDetalle(id);
    imprimirEvaluacion(d, nombre, config);
  }

  async function borrar(id: string) {
    const ok = await confirmar({
      titulo: "Eliminar evaluación",
      mensaje: "¿Eliminar esta evaluación? Dejará de verse en el sistema (solo un administrador podría recuperarla directo en la base de datos).",
      confirmar: "Eliminar",
      peligro: true,
    });
    if (!ok) return;
    await eliminar.mutateAsync(id);
    toast.success("Evaluación eliminada");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-fredoka text-3xl text-luda-gris">Evaluaciones</h1>
        <div className="ml-auto flex items-center gap-2">
          <Select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="h-9 w-auto text-xs"
          >
            <option value="">Todos los estatus</option>
            {ESTATUS_EVALUACION_OPCIONES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Button size="sm" onClick={nuevo}>
            <Plus className="h-4 w-4" /> Nueva evaluación
          </Button>
        </div>
      </div>

      {isLoading && <p className="text-sm text-luda-gris-light">Cargando…</p>}
      {isError && (
        <LudaCard className="border border-red-200 bg-red-50 p-6">
          <p className="text-sm font-semibold text-red-600">
            No se pudieron cargar las evaluaciones. Intenta recargar la página.
          </p>
        </LudaCard>
      )}
      {!isLoading && !isError && visibles.length === 0 && (
        <LudaCard className="p-6">
          <p className="text-sm text-luda-gris-light">No hay evaluaciones.</p>
        </LudaCard>
      )}

      <div className="space-y-2">
        {visibles.map((e) => (
          <LudaCard key={e.id} className="flex flex-wrap items-center gap-3 p-4">
            <ClipboardList className="h-5 w-5 text-luda-lila-dark" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-luda-gris">
                {e.paciente_nombre}{" "}
                <span className="font-normal text-luda-gris-light">
                  · {tipoLabel(e.tipo_prueba)}
                </span>
              </p>
              <p className="text-xs text-luda-gris-light">
                {format(new Date(e.fecha_aplicacion), "d 'de' MMM yyyy", { locale: es })}
                {e.ci_total != null && ` · CI ${e.ci_total}`}
              </p>
            </div>
            <span className="rounded-full bg-luda-lila-light px-2.5 py-0.5 text-xs font-semibold text-luda-lila-dark">
              {ESTATUS_EVALUACION_LABEL[e.estatus] ?? e.estatus}
            </span>
            <button onClick={() => imprimir(e.id, e.paciente_nombre)} aria-label="Imprimir" className="rounded-lg p-2 text-luda-gris-light hover:bg-luda-lila-light hover:text-luda-lila-dark">
              <Printer className="h-4 w-4" />
            </button>
            <button onClick={() => editar(e.id)} aria-label="Editar" className="rounded-lg p-2 text-luda-gris-light hover:bg-luda-lila-light hover:text-luda-lila-dark">
              <FileEdit className="h-4 w-4" />
            </button>
            <button onClick={() => borrar(e.id)} aria-label="Eliminar" className="rounded-lg p-2 text-luda-gris-light hover:bg-red-50 hover:text-red-500">
              <Trash2 className="h-4 w-4" />
            </button>
          </LudaCard>
        ))}
      </div>

      <Modal
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo={editId ? "Editar evaluación" : "Nueva evaluación"}
        className="max-w-2xl"
      >
        <EvaluacionForm
          evaluacionId={editId ?? undefined}
          inicial={inicial}
          guardando={crear.isPending || actualizar.isPending}
          onGuardar={guardar}
        />
      </Modal>
    </div>
  );
}
