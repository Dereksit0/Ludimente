"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Search, Target, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LudaCard } from "@/components/ui/luda-card";
import { LudaStat } from "@/components/ui/luda-stat";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { usePacientes } from "@/hooks/use-pacientes";
import { usePsicologos } from "@/hooks/use-perfiles";
import { useCrearPlan, usePlanes, type PlanListItem } from "@/hooks/use-planes";
import { ESTATUS_PLAN_OPCIONES } from "@/lib/catalogos";
import { planSchema, primerError } from "@/lib/validations/modulos.schema";
import { ESTATUS_PLAN_CLASES, ESTATUS_PLAN_LABEL } from "@/types/app.types";
import type { EstatusPlan } from "@/types/database.types";

import { BarraAvance } from "./barra-avance";

const hoy = () => new Date().toISOString().slice(0, 10);

export function PlanesCliente() {
  const router = useRouter();
  const { data: planes = [], isLoading } = usePlanes();
  const [filtro, setFiltro] = useState<EstatusPlan | "">("");
  const [busqueda, setBusqueda] = useState("");
  const [crear, setCrear] = useState(false);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return planes
      .filter((p) => (filtro ? p.estatus === filtro : true))
      .filter((p) =>
        q
          ? p.paciente_nombre.toLowerCase().includes(q) ||
            p.expediente.toLowerCase().includes(q) ||
            p.titulo.toLowerCase().includes(q)
          : true,
      );
  }, [planes, filtro, busqueda]);

  const stats = useMemo(() => {
    const activos = planes.filter((p) => p.estatus === "activo").length;
    const conObj = planes.filter((p) => p.total_objetivos > 0);
    const avance =
      conObj.length === 0
        ? 0
        : Math.round(
            conObj.reduce((a, p) => a + p.avance, 0) / conObj.length,
          );
    return { total: planes.length, activos, avance };
  }, [planes]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-fredoka text-3xl text-luda-gris">
            Planes de intervención
          </h1>
          <p className="mt-1 text-sm text-luda-gris-light">
            Objetivos terapéuticos y seguimiento de avance.
          </p>
        </div>
        <Button onClick={() => setCrear(true)}>
          <Plus /> Nuevo plan
        </Button>
      </div>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <LudaStat label="Planes totales" value={stats.total} icon={Target} acento="lila" />
        <LudaStat label="Activos" value={stats.activos} icon={Target} acento="azul" />
        <LudaStat label="Avance promedio" value={`${stats.avance}%`} icon={TrendingUp} acento="rosa" />
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-luda-gris-light" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar paciente, expediente o plan…"
            className="h-9 pl-9 text-xs"
          />
        </div>
        <Select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value as EstatusPlan | "")}
          className="h-9 w-auto text-xs"
        >
          <option value="">Todos los estatus</option>
          {ESTATUS_PLAN_OPCIONES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <span className="text-sm text-luda-gris-light">
          {visibles.length} plan(es)
        </span>
      </div>

      {isLoading && <p className="text-sm text-luda-gris-light">Cargando…</p>}

      {!isLoading && visibles.length === 0 && (
        <LudaCard className="p-8 text-center">
          <Target className="mx-auto h-10 w-10 text-luda-lila" />
          <p className="mt-3 font-semibold text-luda-gris">
            Aún no hay planes de intervención
          </p>
          <p className="mt-1 text-sm text-luda-gris-light">
            Crea el primer plan para empezar a definir objetivos.
          </p>
        </LudaCard>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibles.map((p) => (
          <PlanCard key={p.id} plan={p} />
        ))}
      </div>

      {crear && (
        <ModalNuevoPlan
          onCerrar={() => setCrear(false)}
          onCreado={(id) => {
            setCrear(false);
            toast.success("Plan creado");
            router.push(`/planes/${id}`);
          }}
        />
      )}
    </div>
  );
}

function PlanCard({ plan }: { plan: PlanListItem }) {
  return (
    <Link href={`/planes/${plan.id}`} className="group block">
      <LudaCard className="h-full p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-luda-md">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-bold text-luda-gris group-hover:text-luda-lila-dark">
              {plan.paciente_nombre}
            </h3>
            <p className="truncate text-xs font-semibold text-luda-gris-light">
              {plan.expediente} · {plan.titulo}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
              ESTATUS_PLAN_CLASES[plan.estatus as EstatusPlan]
            }`}
          >
            {ESTATUS_PLAN_LABEL[plan.estatus as EstatusPlan]}
          </span>
        </div>

        <div className="mt-4">
          <BarraAvance valor={plan.avance} />
          <p className="mt-1.5 text-xs text-luda-gris-light">
            {plan.total_objetivos} objetivo(s) ·{" "}
            {format(new Date(plan.fecha_inicio), "d MMM yyyy", { locale: es })}
            {plan.psicologo_nombre ? ` · ${plan.psicologo_nombre}` : ""}
          </p>
        </div>
      </LudaCard>
    </Link>
  );
}

function ModalNuevoPlan({
  onCerrar,
  onCreado,
}: {
  onCerrar: () => void;
  onCreado: (id: string) => void;
}) {
  const { data: pacientes = [] } = usePacientes();
  const { data: psicologos = [] } = usePsicologos();
  const crearPlan = useCrearPlan();

  const [pacienteId, setPacienteId] = useState("");
  const [psicologoId, setPsicologoId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaInicio, setFechaInicio] = useState(hoy());
  const [fechaFin, setFechaFin] = useState("");

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const val = planSchema.safeParse({
      paciente_id: pacienteId,
      titulo,
      fecha_inicio: fechaInicio,
      fecha_fin_estimada: fechaFin || null,
    });
    if (!val.success) {
      toast.error(primerError(val.error));
      return;
    }
    try {
      const id = await crearPlan.mutateAsync({
        paciente_id: pacienteId,
        psicologo_id: psicologoId || null,
        titulo: titulo.trim(),
        diagnostico_base: diagnostico.trim() || null,
        descripcion: descripcion.trim() || null,
        fecha_inicio: fechaInicio,
        fecha_fin_estimada: fechaFin || null,
      });
      onCreado(id);
    } catch {
      toast.error("No se pudo crear el plan");
    }
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo="Nuevo plan de intervención">
      <form onSubmit={guardar} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="paciente">Paciente</Label>
          <Select
            id="paciente"
            value={pacienteId}
            onChange={(e) => setPacienteId(e.target.value)}
            required
          >
            <option value="" disabled>
              Selecciona…
            </option>
            {pacientes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} {p.apellido_paterno} {p.apellido_materno ?? ""} ·{" "}
                {p.numero_expediente}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="titulo">Título del plan</Label>
          <Input
            id="titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej. Plan de intervención en lectoescritura"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="psicologo">Terapeuta responsable</Label>
          <Select
            id="psicologo"
            value={psicologoId}
            onChange={(e) => setPsicologoId(e.target.value)}
          >
            <option value="">Sin asignar</option>
            {psicologos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="diagnostico">Diagnóstico base (opcional)</Label>
          <Input
            id="diagnostico"
            value={diagnostico}
            onChange={(e) => setDiagnostico(e.target.value)}
            placeholder="Ej. Dislexia"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="inicio">Fecha de inicio</Label>
            <Input
              id="inicio"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fin">Fin estimado (opcional)</Label>
            <Input
              id="fin"
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="descripcion">Descripción (opcional)</Label>
          <Textarea
            id="descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Enfoque general, contexto del caso…"
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={crearPlan.isPending}>
            {crearPlan.isPending ? "Creando…" : "Crear plan"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
