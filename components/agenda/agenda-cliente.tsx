"use client";

import { useMemo, useState } from "react";

import {
  addDays,
  addWeeks,
  format,
  isSameDay,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Video,
} from "lucide-react";
import { toast } from "sonner";

import { CitaForm } from "@/components/agenda/cita-form";
import { SesionForm } from "@/components/pacientes/tabs/sesiones-tab";
import { Button } from "@/components/ui/button";
import { LudaBadge } from "@/components/ui/luda-badge";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import {
  useActualizarCita,
  useCambiarEstatusCita,
  useCitasRango,
  useCompletarCita,
  useCrearCita,
  useEliminarCita,
  useReagendarCita,
} from "@/hooks/use-citas";
import { usePsicologos } from "@/hooks/use-perfiles";
import { useCrearSesion } from "@/hooks/use-sesiones";
import { TIPO_CITA_LABEL } from "@/types/app.types";
import type { CitaConRelaciones } from "@/types/app.types";
import type { CitaInput } from "@/lib/validations/cita.schema";
import type { SesionInput } from "@/lib/validations/sesion.schema";
import type { EstatusCita } from "@/types/database.types";

const errMsg = (e: unknown, fallback: string) =>
  e instanceof Error ? e.message : fallback;

/** Convierte una cita guardada al shape del formulario. */
function citaAInput(c: CitaConRelaciones): Partial<CitaInput> {
  const ini = new Date(c.fecha_inicio);
  const fin = new Date(c.fecha_fin);
  return {
    paciente_id: c.paciente_id,
    psicologo_id: c.psicologo_id,
    fecha: format(ini, "yyyy-MM-dd"),
    hora: format(ini, "HH:mm"),
    duracion_min: Math.round((fin.getTime() - ini.getTime()) / 60000),
    tipo: c.tipo,
    modalidad: c.modalidad,
    notas_previas: c.notas_previas ?? "",
  };
}

export function AgendaCliente() {
  const [ancla, setAncla] = useState(new Date());
  const [filtroPsico, setFiltroPsico] = useState("");
  const [formAbierto, setFormAbierto] = useState(false);
  const [editando, setEditando] = useState<CitaConRelaciones | null>(null);
  const [detalle, setDetalle] = useState<CitaConRelaciones | null>(null);
  const [notaPara, setNotaPara] = useState<CitaConRelaciones | null>(null);

  const inicioSemana = useMemo(
    () => startOfWeek(ancla, { weekStartsOn: 1 }),
    [ancla],
  );
  const finSemana = useMemo(() => addDays(inicioSemana, 6), [inicioSemana]);
  const dias = useMemo(
    () => Array.from({ length: 6 }, (_, i) => addDays(inicioSemana, i)), // Lun-Sáb
    [inicioSemana],
  );

  const { data: psicologos = [] } = usePsicologos();
  const { data: citas = [], isLoading } = useCitasRango(
    inicioSemana.toISOString(),
    addDays(finSemana, 1).toISOString(),
  );

  const visibles = filtroPsico
    ? citas.filter((c) => c.psicologo_id === filtroPsico)
    : citas;

  const crear = useCrearCita();
  const actualizar = useActualizarCita();
  const cambiarEstatus = useCambiarEstatusCita();
  const eliminar = useEliminarCita();
  const completar = useCompletarCita();
  const reagendar = useReagendarCita();
  const crearSesion = useCrearSesion(notaPara?.paciente_id ?? "");

  async function guardar(valores: CitaInput) {
    try {
      if (editando) {
        await actualizar.mutateAsync({ id: editando.id, input: valores });
        toast.success("Cita actualizada");
      } else {
        await crear.mutateAsync(valores);
        toast.success("Cita creada");
      }
      setFormAbierto(false);
      setEditando(null);
    } catch (e) {
      toast.error(errMsg(e, "No se pudo guardar la cita"));
    }
  }

  async function setEstatus(c: CitaConRelaciones, estatus: EstatusCita) {
    let motivo: string | undefined;
    if (estatus === "cancelada" || estatus === "no_asistio") {
      motivo =
        window.prompt(
          estatus === "cancelada"
            ? "Motivo de cancelación (opcional):"
            : "Nota de la inasistencia (opcional):",
        ) ?? undefined;
    }
    await cambiarEstatus.mutateAsync({ id: c.id, estatus, motivo });
    setDetalle(null);
    toast.success("Cita actualizada");
  }

  /** Completa la cita → genera cobro pendiente y ofrece capturar la nota. */
  async function completarYcobrar(c: CitaConRelaciones) {
    try {
      await completar.mutateAsync({
        citaId: c.id,
        pacienteId: c.paciente_id,
        concepto: TIPO_CITA_LABEL[c.tipo] ?? "Sesión",
      });
      setDetalle(null);
      setNotaPara(c);
      toast.success("Cita completada. Se generó un cobro pendiente.");
    } catch (e) {
      toast.error(errMsg(e, "No se pudo completar la cita"));
    }
  }

  async function guardarNota(v: SesionInput) {
    try {
      await crearSesion.mutateAsync(v);
      toast.success("Nota guardada");
      setNotaPara(null);
    } catch {
      toast.error("No se pudo guardar la nota");
    }
  }

  /** Reagenda al soltar una cita en otro día (conserva la hora y duración). */
  async function soltarEnDia(citaId: string, dia: Date) {
    const c = citas.find((x) => x.id === citaId);
    if (!c) return;
    const ini = new Date(c.fecha_inicio);
    if (isSameDay(ini, dia)) return;
    const nuevoIni = new Date(dia);
    nuevoIni.setHours(ini.getHours(), ini.getMinutes(), 0, 0);
    const dur = new Date(c.fecha_fin).getTime() - ini.getTime();
    const nuevoFin = new Date(nuevoIni.getTime() + dur);
    try {
      await reagendar.mutateAsync({
        id: c.id,
        psicologoId: c.psicologo_id,
        fechaInicio: nuevoIni.toISOString(),
        fechaFin: nuevoFin.toISOString(),
      });
      toast.success("Cita reagendada");
    } catch (e) {
      toast.error(errMsg(e, "No se pudo reagendar"));
    }
  }

  async function borrar(c: CitaConRelaciones) {
    if (!window.confirm("¿Eliminar esta cita?")) return;
    await eliminar.mutateAsync(c.id);
    setDetalle(null);
    toast.success("Cita eliminada");
  }

  return (
    <div className="space-y-4">
      {/* Barra superior */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-fredoka text-3xl text-luda-gris">Agenda</h1>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAncla(addWeeks(ancla, -1))}
              aria-label="Semana anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setAncla(new Date())}>
              Hoy
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAncla(addWeeks(ancla, 1))}
              aria-label="Semana siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Select
            value={filtroPsico}
            onChange={(e) => setFiltroPsico(e.target.value)}
            className="h-9 w-auto text-xs"
          >
            <option value="">Todos los terapeutas</option>
            {psicologos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </Select>
          <Button
            size="sm"
            onClick={() => {
              setEditando(null);
              setFormAbierto(true);
            }}
          >
            <CalendarPlus className="h-4 w-4" /> Nueva cita
          </Button>
        </div>
      </div>

      <p className="text-sm font-semibold capitalize text-luda-gris-light">
        {format(inicioSemana, "d 'de' MMMM", { locale: es })} —{" "}
        {format(finSemana, "d 'de' MMMM yyyy", { locale: es })}
      </p>

      {/* Cuadrícula semanal */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {dias.map((dia) => {
          const delDia = visibles
            .filter((c) => isSameDay(new Date(c.fecha_inicio), dia))
            .sort(
              (a, b) =>
                new Date(a.fecha_inicio).getTime() -
                new Date(b.fecha_inicio).getTime(),
            );
          const esHoy = isSameDay(dia, new Date());
          return (
            <div
              key={dia.toISOString()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) =>
                soltarEnDia(e.dataTransfer.getData("text/plain"), dia)
              }
              className="rounded-2xl border border-luda-lila/15 bg-white p-2"
            >
              <div
                className={`mb-2 rounded-xl px-2 py-1.5 text-center ${
                  esHoy ? "bg-luda-lila text-white" : "text-luda-gris"
                }`}
              >
                <p className="text-[11px] font-semibold uppercase">
                  {format(dia, "EEE", { locale: es })}
                </p>
                <p className="font-fredoka text-lg leading-none">
                  {format(dia, "d")}
                </p>
              </div>
              <div className="space-y-2">
                {delDia.length === 0 && (
                  <p className="px-1 py-3 text-center text-[11px] text-luda-gris-light">
                    Sin citas
                  </p>
                )}
                {delDia.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    draggable
                    onDragStart={(e) =>
                      e.dataTransfer.setData("text/plain", c.id)
                    }
                    onClick={() => setDetalle(c)}
                    className="w-full cursor-grab rounded-xl border-l-4 bg-luda-fondo p-2 text-left transition-colors hover:bg-luda-lila-light active:cursor-grabbing"
                    style={{
                      borderLeftColor: c.psicologo?.color_agenda ?? "#C9A8E0",
                    }}
                  >
                    <p className="flex items-center gap-1 text-[11px] font-bold text-luda-gris">
                      <Clock className="h-3 w-3" />
                      {format(new Date(c.fecha_inicio), "HH:mm")}
                      {c.modalidad === "videollamada" && (
                        <Video className="h-3 w-3 text-luda-lila-dark" />
                      )}
                    </p>
                    <p className="truncate text-xs font-semibold text-luda-gris">
                      {c.paciente?.nombre} {c.paciente?.apellido_paterno}
                    </p>
                    <p className="truncate text-[10px] text-luda-gris-light">
                      {TIPO_CITA_LABEL[c.tipo] ?? c.tipo}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {isLoading && (
        <p className="text-sm text-luda-gris-light">Cargando agenda…</p>
      )}

      {/* Modal crear/editar */}
      <Modal
        abierto={formAbierto}
        onCerrar={() => {
          setFormAbierto(false);
          setEditando(null);
        }}
        titulo={editando ? "Editar cita" : "Nueva cita"}
      >
        <CitaForm
          inicial={editando ? citaAInput(editando) : undefined}
          guardando={crear.isPending || actualizar.isPending}
          onGuardar={guardar}
        />
      </Modal>

      {/* Modal detalle */}
      <Modal
        abierto={Boolean(detalle)}
        onCerrar={() => setDetalle(null)}
        titulo="Detalle de la cita"
      >
        {detalle && (
          <div className="space-y-4">
            <div>
              <p className="font-bold text-luda-gris">
                {detalle.paciente?.nombre} {detalle.paciente?.apellido_paterno}
              </p>
              <p className="text-sm text-luda-gris-light">
                {TIPO_CITA_LABEL[detalle.tipo] ?? detalle.tipo} ·{" "}
                {detalle.modalidad}
              </p>
            </div>
            <p className="text-sm capitalize text-luda-gris">
              {format(
                new Date(detalle.fecha_inicio),
                "EEEE d 'de' MMMM · HH:mm",
                { locale: es },
              )}{" "}
              — {format(new Date(detalle.fecha_fin), "HH:mm")}
            </p>
            <div className="flex items-center gap-2">
              <LudaBadge tipo="cita" status={detalle.estatus} />
              <span className="text-xs text-luda-gris-light">
                {detalle.psicologo?.full_name}
              </span>
            </div>
            {detalle.notas_previas && (
              <p className="rounded-xl bg-luda-fondo p-3 text-sm text-luda-gris">
                {detalle.notas_previas}
              </p>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditando(detalle);
                  setDetalle(null);
                  setFormAbierto(true);
                }}
              >
                Editar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEstatus(detalle, "confirmada")}
              >
                Confirmar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => completarYcobrar(detalle)}
              >
                Completar y cobrar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEstatus(detalle, "no_asistio")}
              >
                No asistió
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-500 hover:bg-red-50"
                onClick={() => setEstatus(detalle, "cancelada")}
              >
                Cancelar cita
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto text-red-500 hover:bg-red-50"
                onClick={() => borrar(detalle)}
              >
                Eliminar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de nota tras completar la cita */}
      <Modal
        abierto={Boolean(notaPara)}
        onCerrar={() => setNotaPara(null)}
        titulo="Agregar nota de la sesión"
        className="max-w-2xl"
      >
        {notaPara && (
          <SesionForm
            psicologoSugerido={notaPara.psicologo_id}
            citaId={notaPara.id}
            inicial={{
              fecha_sesion: format(new Date(notaPara.fecha_inicio), "yyyy-MM-dd"),
            }}
            guardando={crearSesion.isPending}
            onGuardar={guardarNota}
          />
        )}
      </Modal>
    </div>
  );
}
