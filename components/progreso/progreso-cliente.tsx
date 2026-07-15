"use client";

import { useEffect, useMemo, useState } from "react";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Eye,
  EyeOff,
  FileText,
  Pencil,
  Plus,
  Printer,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LudaCard } from "@/components/ui/luda-card";
import { Modal } from "@/components/ui/modal";
import { RedactarBoton } from "@/components/ui/redactar-boton";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useConfiguracion } from "@/hooks/use-configuracion";
import { useDraftState } from "@/hooks/use-form-draft";
import { usePacientes } from "@/hooks/use-pacientes";
import { usePlanes } from "@/hooks/use-planes";
import {
  useActualizarReporte,
  useCrearReporte,
  useEliminarReporte,
  useReportesProgreso,
  useToggleCompartirReporte,
  type ReporteListItem,
} from "@/hooks/use-reportes-progreso";
import { imprimirReporteProgreso } from "@/lib/print-progreso";
import { primerError, reporteSchema } from "@/lib/validations/modulos.schema";

const hoy = () => new Date().toISOString().slice(0, 10);

export function ProgresoCliente() {
  const { data: reportes = [], isLoading } = useReportesProgreso();
  const { data: config } = useConfiguracion();
  const toggle = useToggleCompartirReporte();
  const eliminar = useEliminarReporte();
  const confirmar = useConfirm();
  const [busqueda, setBusqueda] = useState("");
  const [crear, setCrear] = useState(false);
  const [editar, setEditar] = useState<ReporteListItem | null>(null);
  const [pacientePreseleccionado, setPacientePreseleccionado] = useState<
    string | null
  >(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("paciente");
    if (id) {
      setPacientePreseleccionado(id);
      setCrear(true);
    }
  }, []);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return reportes.filter((r) =>
      q
        ? r.paciente_nombre.toLowerCase().includes(q) ||
          r.titulo.toLowerCase().includes(q) ||
          r.expediente.toLowerCase().includes(q)
        : true,
    );
  }, [reportes, busqueda]);

  async function compartir(r: ReporteListItem) {
    await toggle.mutateAsync({ id: r.id, compartido: !r.compartido });
    toast.success(r.compartido ? "Reporte oculto a los padres" : "Reporte compartido con los padres");
  }

  async function borrar(id: string) {
    const ok = await confirmar({
      titulo: "Eliminar reporte",
      mensaje: "¿Eliminar este reporte de progreso?",
      confirmar: "Eliminar",
      peligro: true,
    });
    if (!ok) return;
    await eliminar.mutateAsync(id);
    toast.success("Reporte eliminado");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-fredoka text-3xl text-luda-gris">
            Reportes de progreso
          </h1>
          <p className="mt-1 text-sm text-luda-gris-light">
            Informes de avance para compartir con las familias.
          </p>
        </div>
        <Button onClick={() => setCrear(true)}>
          <Plus /> Nuevo reporte
        </Button>
      </div>

      <div className="relative sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-luda-gris-light" />
        <Input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar paciente o reporte…"
          className="h-9 pl-9 text-xs"
        />
      </div>

      {isLoading && <p className="text-sm text-luda-gris-light">Cargando…</p>}

      {!isLoading && visibles.length === 0 && (
        <LudaCard className="p-8 text-center">
          <FileText className="mx-auto h-10 w-10 text-luda-lila" />
          <p className="mt-3 font-semibold text-luda-gris">
            Aún no hay reportes de progreso
          </p>
          <p className="mt-1 text-sm text-luda-gris-light">
            Crea uno a partir de un plan de intervención para mostrar avances.
          </p>
        </LudaCard>
      )}

      <div className="space-y-2">
        {visibles.map((r) => (
          <LudaCard key={r.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-luda-gris">
                {r.titulo}
              </p>
              <p className="text-xs text-luda-gris-light">
                {r.paciente_nombre} · {r.expediente} ·{" "}
                {format(new Date(r.created_at), "d MMM yyyy", { locale: es })}
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                r.compartido
                  ? "bg-green-50 text-green-700"
                  : "bg-gray-50 text-gray-500"
              }`}
            >
              {r.compartido ? "Compartido" : "Privado"}
            </span>
            <Button
              size="sm"
              variant="ghost"
              disabled={toggle.isPending}
              onClick={() => compartir(r)}
            >
              {r.compartido ? (
                <>
                  <EyeOff className="h-4 w-4" /> Ocultar
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" /> Compartir
                </>
              )}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditar(r)}>
              <Pencil className="h-4 w-4" /> Editar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => imprimirReporteProgreso(r, config)}
            >
              <Printer className="h-4 w-4" /> Imprimir
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Eliminar"
              disabled={eliminar.isPending}
              onClick={() => borrar(r.id)}
              className="h-9 w-9 text-luda-gris-light hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </LudaCard>
        ))}
      </div>

      {crear && (
        <ModalNuevoReporte
          pacienteInicial={pacientePreseleccionado ?? undefined}
          onCerrar={() => setCrear(false)}
        />
      )}
      {editar && (
        <ModalEditarReporte reporte={editar} onCerrar={() => setEditar(null)} />
      )}
    </div>
  );
}

function ModalEditarReporte({
  reporte,
  onCerrar,
}: {
  reporte: ReporteListItem;
  onCerrar: () => void;
}) {
  const actualizar = useActualizarReporte(reporte.id);
  const [titulo, setTitulo] = useState(reporte.titulo);
  const [inicio, setInicio] = useState(reporte.periodo_inicio?.slice(0, 10) ?? "");
  const [fin, setFin] = useState(reporte.periodo_fin?.slice(0, 10) ?? "");
  const [resumen, setResumen] = useState(reporte.resumen ?? "");
  const [logros, setLogros] = useState(reporte.logros ?? "");
  const [recomendaciones, setRecomendaciones] = useState(
    reporte.recomendaciones ?? "",
  );

  const { limpiar } = useDraftState({
    clave: `draft:reporte:${reporte.id}`,
    activo: true,
    valores: { titulo, inicio, fin, resumen, logros, recomendaciones },
    onRestaurar: (b) => {
      setTitulo(b.titulo);
      setInicio(b.inicio);
      setFin(b.fin);
      setResumen(b.resumen);
      setLogros(b.logros);
      setRecomendaciones(b.recomendaciones);
    },
  });

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) {
      toast.error("Escribe un título");
      return;
    }
    try {
      await actualizar.mutateAsync({
        titulo: titulo.trim(),
        periodo_inicio: inicio || null,
        periodo_fin: fin || null,
        resumen: resumen.trim() || null,
        logros: logros.trim() || null,
        recomendaciones: recomendaciones.trim() || null,
      });
      limpiar();
      toast.success("Reporte actualizado");
      onCerrar();
    } catch {
      toast.error("No se pudo actualizar el reporte");
    }
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo="Editar reporte de progreso">
      <form onSubmit={guardar} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="edit-titulo">Título</Label>
          <Input
            id="edit-titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-inicio">Periodo desde (opcional)</Label>
            <Input
              id="edit-inicio"
              type="date"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-fin">Periodo hasta</Label>
            <Input
              id="edit-fin"
              type="date"
              value={fin}
              onChange={(e) => setFin(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-resumen">Resumen del periodo</Label>
          <Textarea
            id="edit-resumen"
            value={resumen}
            onChange={(e) => setResumen(e.target.value)}
          />
          <RedactarBoton
            valor={resumen}
            contexto="Reporte de progreso para padres: resumen del periodo"
            onRedactado={setResumen}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-logros">Logros destacados (opcional)</Label>
          <Textarea
            id="edit-logros"
            value={logros}
            onChange={(e) => setLogros(e.target.value)}
          />
          <RedactarBoton
            valor={logros}
            contexto="Reporte de progreso para padres: logros destacados"
            onRedactado={setLogros}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-reco">Recomendaciones para casa (opcional)</Label>
          <Textarea
            id="edit-reco"
            value={recomendaciones}
            onChange={(e) => setRecomendaciones(e.target.value)}
          />
          <RedactarBoton
            valor={recomendaciones}
            contexto="Reporte de progreso para padres: recomendaciones para casa"
            onRedactado={setRecomendaciones}
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={actualizar.isPending}>
            {actualizar.isPending ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ModalNuevoReporte({
  pacienteInicial,
  onCerrar,
}: {
  pacienteInicial?: string;
  onCerrar: () => void;
}) {
  const { data: pacientes = [] } = usePacientes();
  const { data: planes = [] } = usePlanes();
  const crear = useCrearReporte();

  const [pacienteId, setPacienteId] = useState(pacienteInicial ?? "");
  const [planId, setPlanId] = useState("");
  const [titulo, setTitulo] = useState(
    `Reporte de progreso · ${format(new Date(), "MMMM yyyy", { locale: es })}`,
  );
  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState(hoy());
  const [resumen, setResumen] = useState("");
  const [logros, setLogros] = useState("");
  const [recomendaciones, setRecomendaciones] = useState("");

  const planesPaciente = useMemo(
    () => planes.filter((p) => p.paciente_id === pacienteId),
    [planes, pacienteId],
  );

  const { limpiar } = useDraftState({
    clave: `draft:reporte:nuevo:${pacienteInicial ?? "sin-paciente"}`,
    activo: true,
    valores: { pacienteId, planId, titulo, inicio, fin, resumen, logros, recomendaciones },
    onRestaurar: (b) => {
      setPacienteId(b.pacienteId);
      setPlanId(b.planId);
      setTitulo(b.titulo);
      setInicio(b.inicio);
      setFin(b.fin);
      setResumen(b.resumen);
      setLogros(b.logros);
      setRecomendaciones(b.recomendaciones);
    },
  });

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const val = reporteSchema.safeParse({
      paciente_id: pacienteId,
      titulo,
      periodo_inicio: inicio || null,
      periodo_fin: fin || null,
    });
    if (!val.success) {
      toast.error(primerError(val.error));
      return;
    }
    try {
      await crear.mutateAsync({
        paciente_id: pacienteId,
        plan_id: planId || null,
        titulo: titulo.trim(),
        periodo_inicio: inicio || null,
        periodo_fin: fin || null,
        resumen: resumen.trim() || null,
        logros: logros.trim() || null,
        recomendaciones: recomendaciones.trim() || null,
      });
      limpiar();
      toast.success("Reporte creado");
      onCerrar();
    } catch {
      toast.error("No se pudo crear el reporte");
    }
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo="Nuevo reporte de progreso">
      <form onSubmit={guardar} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="paciente">Paciente</Label>
          <Select
            id="paciente"
            value={pacienteId}
            onChange={(e) => {
              setPacienteId(e.target.value);
              setPlanId("");
            }}
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
          <Label htmlFor="plan">
            Plan de intervención (opcional · incluye avance de objetivos)
          </Label>
          <Select
            id="plan"
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            disabled={!pacienteId}
          >
            <option value="">Sin plan asociado</option>
            {planesPaciente.map((p) => (
              <option key={p.id} value={p.id}>
                {p.titulo} ({p.avance}% · {p.total_objetivos} objetivos)
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="titulo">Título</Label>
          <Input
            id="titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="inicio">Periodo desde (opcional)</Label>
            <Input
              id="inicio"
              type="date"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fin">Periodo hasta</Label>
            <Input
              id="fin"
              type="date"
              value={fin}
              onChange={(e) => setFin(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="resumen">Resumen del periodo</Label>
          <Textarea
            id="resumen"
            value={resumen}
            onChange={(e) => setResumen(e.target.value)}
            placeholder="Evolución general del niño/a durante el periodo…"
          />
          <RedactarBoton
            valor={resumen}
            contexto="Reporte de progreso para padres: resumen del periodo"
            onRedactado={setResumen}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="logros">Logros destacados (opcional)</Label>
          <Textarea
            id="logros"
            value={logros}
            onChange={(e) => setLogros(e.target.value)}
          />
          <RedactarBoton
            valor={logros}
            contexto="Reporte de progreso para padres: logros destacados"
            onRedactado={setLogros}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reco">Recomendaciones para casa (opcional)</Label>
          <Textarea
            id="reco"
            value={recomendaciones}
            onChange={(e) => setRecomendaciones(e.target.value)}
          />
          <RedactarBoton
            valor={recomendaciones}
            contexto="Reporte de progreso para padres: recomendaciones para casa"
            onRedactado={setRecomendaciones}
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={crear.isPending}>
            {crear.isPending ? "Creando…" : "Crear reporte"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
