"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Plus, Target, Trash2, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LudaCard } from "@/components/ui/luda-card";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useActualizarPlan,
  useCrearObjetivo,
  useEliminarObjetivo,
  useEliminarPlan,
  usePlan,
  useRegistrarSeguimiento,
  type ObjetivoConSeguimientos,
} from "@/hooks/use-planes";
import {
  AREA_OBJETIVO_OPCIONES,
  ESTATUS_PLAN_OPCIONES,
  PRIORIDAD_OBJETIVO_OPCIONES,
} from "@/lib/catalogos";
import {
  AREA_OBJETIVO_LABEL,
  ESTATUS_OBJETIVO_CLASES,
  ESTATUS_OBJETIVO_LABEL,
  ESTATUS_PLAN_CLASES,
  ESTATUS_PLAN_LABEL,
  PRIORIDAD_OBJETIVO_CLASES,
  PRIORIDAD_OBJETIVO_LABEL,
} from "@/types/app.types";
import type {
  AreaObjetivo,
  EstatusObjetivo,
  EstatusPlan,
  PrioridadObjetivo,
} from "@/types/database.types";

import { objetivoSchema, primerError } from "@/lib/validations/modulos.schema";

import { BarraAvance } from "./barra-avance";

export function PlanDetalle({ id }: { id: string }) {
  const router = useRouter();
  const { data: plan, isLoading, isError } = usePlan(id);
  const actualizar = useActualizarPlan(id);
  const eliminarPlan = useEliminarPlan();
  const confirmar = useConfirm();

  const [agregar, setAgregar] = useState(false);

  if (isLoading) {
    return <p className="text-sm text-luda-gris-light">Cargando plan…</p>;
  }
  if (isError || !plan) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
        No pudimos cargar este plan.
      </p>
    );
  }

  const avance =
    plan.objetivos.length === 0
      ? 0
      : Math.round(
          plan.objetivos.reduce((a, o) => a + o.progreso, 0) /
            plan.objetivos.length,
        );

  async function cambiarEstatus(estatus: EstatusPlan) {
    await actualizar.mutateAsync({ estatus });
    toast.success("Plan actualizado");
  }

  async function borrarPlan() {
    const ok = await confirmar({
      titulo: "Eliminar plan",
      mensaje:
        "¿Eliminar este plan y todos sus objetivos y avances? Esta acción no se puede deshacer.",
      confirmar: "Eliminar",
      peligro: true,
    });
    if (!ok) return;
    await eliminarPlan.mutateAsync(id);
    toast.success("Plan eliminado");
    router.push("/planes");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/planes"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-luda-gris-light transition-colors hover:text-luda-lila-dark"
      >
        <ArrowLeft className="h-4 w-4" /> Planes
      </Link>

      {/* Encabezado del plan */}
      <LudaCard className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-fredoka text-2xl text-luda-gris">
              {plan.titulo}
            </h1>
            <p className="mt-1 text-sm text-luda-gris-light">
              <Link
                href={`/pacientes/${plan.paciente_id}`}
                className="font-semibold text-luda-lila-dark hover:underline"
              >
                {plan.paciente_nombre}
              </Link>{" "}
              · {plan.expediente}
              {plan.psicologo_nombre ? ` · ${plan.psicologo_nombre}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={plan.estatus}
              onChange={(e) => cambiarEstatus(e.target.value as EstatusPlan)}
              className={`h-9 w-auto text-xs font-semibold ${
                ESTATUS_PLAN_CLASES[plan.estatus as EstatusPlan]
              }`}
            >
              {ESTATUS_PLAN_OPCIONES.map((o) => (
                <option key={o.value} value={o.value}>
                  {ESTATUS_PLAN_LABEL[o.value]}
                </option>
              ))}
            </Select>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Eliminar plan"
              onClick={borrarPlan}
              className="text-luda-gris-light hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          {plan.diagnostico_base && (
            <p className="text-luda-gris">
              <span className="font-semibold text-luda-gris-light">
                Diagnóstico base:{" "}
              </span>
              {plan.diagnostico_base}
            </p>
          )}
          <p className="text-luda-gris">
            <span className="font-semibold text-luda-gris-light">Inicio: </span>
            {format(new Date(plan.fecha_inicio), "d 'de' MMM yyyy", {
              locale: es,
            })}
            {plan.fecha_fin_estimada &&
              ` · Fin estimado: ${format(
                new Date(plan.fecha_fin_estimada),
                "d 'de' MMM yyyy",
                { locale: es },
              )}`}
          </p>
        </div>

        {plan.descripcion && (
          <p className="mt-3 whitespace-pre-line text-sm text-luda-gris">
            {plan.descripcion}
          </p>
        )}

        <div className="mt-5">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-luda-gris-light">
            <TrendingUp className="h-3.5 w-3.5" /> Avance general
          </div>
          <BarraAvance valor={avance} />
        </div>
      </LudaCard>

      {/* Objetivos */}
      <div className="flex items-center justify-between">
        <h2 className="font-fredoka text-xl text-luda-gris">
          Objetivos ({plan.objetivos.length})
        </h2>
        <Button size="sm" onClick={() => setAgregar(true)}>
          <Plus /> Agregar objetivo
        </Button>
      </div>

      {plan.objetivos.length === 0 && (
        <LudaCard className="p-8 text-center">
          <Target className="mx-auto h-9 w-9 text-luda-lila" />
          <p className="mt-3 font-semibold text-luda-gris">
            Este plan aún no tiene objetivos
          </p>
          <p className="mt-1 text-sm text-luda-gris-light">
            Agrega metas concretas para medir el progreso.
          </p>
        </LudaCard>
      )}

      <div className="space-y-3">
        {plan.objetivos.map((obj) => (
          <ObjetivoCard key={obj.id} planId={id} objetivo={obj} />
        ))}
      </div>

      {agregar && (
        <ModalAgregarObjetivo planId={id} onCerrar={() => setAgregar(false)} />
      )}
    </div>
  );
}

function ObjetivoCard({
  planId,
  objetivo,
}: {
  planId: string;
  objetivo: ObjetivoConSeguimientos;
}) {
  const eliminar = useEliminarObjetivo(planId);
  const confirmar = useConfirm();
  const [avanzar, setAvanzar] = useState(false);

  async function borrar() {
    const ok = await confirmar({
      titulo: "Eliminar objetivo",
      mensaje: "¿Eliminar este objetivo y sus avances?",
      confirmar: "Eliminar",
      peligro: true,
    });
    if (!ok) return;
    await eliminar.mutateAsync(objetivo.id);
    toast.success("Objetivo eliminado");
  }

  return (
    <LudaCard className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-luda-gris">{objetivo.descripcion}</p>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Eliminar objetivo"
          onClick={borrar}
          className="h-8 w-8 shrink-0 text-luda-gris-light hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Chip clase={ESTATUS_OBJETIVO_CLASES[objetivo.estatus as EstatusObjetivo]}>
          {ESTATUS_OBJETIVO_LABEL[objetivo.estatus as EstatusObjetivo]}
        </Chip>
        <Chip clase="bg-luda-lila-light text-luda-lila-dark border-luda-lila">
          {AREA_OBJETIVO_LABEL[objetivo.area as AreaObjetivo]}
        </Chip>
        <Chip
          clase={PRIORIDAD_OBJETIVO_CLASES[objetivo.prioridad as PrioridadObjetivo]}
        >
          Prioridad {PRIORIDAD_OBJETIVO_LABEL[objetivo.prioridad as PrioridadObjetivo].toLowerCase()}
        </Chip>
        {objetivo.fecha_meta && (
          <span className="text-xs text-luda-gris-light">
            Meta: {format(new Date(objetivo.fecha_meta), "d MMM yyyy", { locale: es })}
          </span>
        )}
      </div>

      <div className="mt-3">
        <BarraAvance valor={objetivo.progreso} />
      </div>

      {objetivo.seguimientos.length > 0 && (
        <div className="mt-3 space-y-1.5 border-t border-luda-lila/10 pt-3">
          {objetivo.seguimientos
            .slice()
            .reverse()
            .map((s) => (
              <div key={s.id} className="flex gap-2 text-xs text-luda-gris-light">
                <span className="shrink-0 font-semibold text-luda-gris">
                  {format(new Date(s.fecha), "d MMM", { locale: es })} · {s.progreso}%
                </span>
                {s.nota && <span className="min-w-0">— {s.nota}</span>}
              </div>
            ))}
        </div>
      )}

      <div className="mt-3">
        <Button size="sm" variant="outline" onClick={() => setAvanzar(true)}>
          <TrendingUp className="h-4 w-4" /> Registrar avance
        </Button>
      </div>

      {avanzar && (
        <ModalRegistrarAvance
          planId={planId}
          objetivoId={objetivo.id}
          progresoActual={objetivo.progreso}
          onCerrar={() => setAvanzar(false)}
        />
      )}
    </LudaCard>
  );
}

function Chip({
  clase,
  children,
}: {
  clase: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${clase}`}
    >
      {children}
    </span>
  );
}

function ModalAgregarObjetivo({
  planId,
  onCerrar,
}: {
  planId: string;
  onCerrar: () => void;
}) {
  const crear = useCrearObjetivo(planId);
  const [descripcion, setDescripcion] = useState("");
  const [area, setArea] = useState<AreaObjetivo>("otro");
  const [prioridad, setPrioridad] = useState<PrioridadObjetivo>("media");
  const [fechaMeta, setFechaMeta] = useState("");

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const val = objetivoSchema.safeParse({ descripcion });
    if (!val.success) {
      toast.error(primerError(val.error));
      return;
    }
    try {
      await crear.mutateAsync({
        descripcion: descripcion.trim(),
        area,
        prioridad,
        fecha_meta: fechaMeta || null,
      });
      toast.success("Objetivo agregado");
      onCerrar();
    } catch {
      toast.error("No se pudo agregar el objetivo");
    }
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo="Nuevo objetivo">
      <form onSubmit={guardar} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="desc">Objetivo</Label>
          <Textarea
            id="desc"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej. Leer palabras de 3 sílabas con 80% de precisión"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="area">Área</Label>
            <Select
              id="area"
              value={area}
              onChange={(e) => setArea(e.target.value as AreaObjetivo)}
            >
              {AREA_OBJETIVO_OPCIONES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prioridad">Prioridad</Label>
            <Select
              id="prioridad"
              value={prioridad}
              onChange={(e) => setPrioridad(e.target.value as PrioridadObjetivo)}
            >
              {PRIORIDAD_OBJETIVO_OPCIONES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="meta">Fecha meta (opcional)</Label>
          <Input
            id="meta"
            type="date"
            value={fechaMeta}
            onChange={(e) => setFechaMeta(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={crear.isPending}>
            {crear.isPending ? "Guardando…" : "Agregar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ModalRegistrarAvance({
  planId,
  objetivoId,
  progresoActual,
  onCerrar,
}: {
  planId: string;
  objetivoId: string;
  progresoActual: number;
  onCerrar: () => void;
}) {
  const registrar = useRegistrarSeguimiento(planId);
  const [progreso, setProgreso] = useState(progresoActual);
  const [nota, setNota] = useState("");

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    try {
      await registrar.mutateAsync({ objetivoId, progreso, nota });
      toast.success("Avance registrado");
      onCerrar();
    } catch {
      toast.error("No se pudo registrar el avance");
    }
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo="Registrar avance">
      <form onSubmit={guardar} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="progreso">Progreso: {progreso}%</Label>
          <input
            id="progreso"
            type="range"
            min={0}
            max={100}
            step={5}
            value={progreso}
            onChange={(e) => setProgreso(Number(e.target.value))}
            className="w-full accent-luda-lila"
          />
          <BarraAvance valor={progreso} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nota">Nota del avance (opcional)</Label>
          <Textarea
            id="nota"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="¿Qué se observó en esta sesión?"
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={registrar.isPending}>
            {registrar.isPending ? "Guardando…" : "Guardar avance"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
