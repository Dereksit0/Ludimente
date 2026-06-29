"use client";

import { useEffect, useMemo, useState } from "react";

import {
  addDays,
  addWeeks,
  format,
  isSameDay,
  set,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarDays,
  CalendarPlus,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Clock,
  LayoutList,
  Video,
} from "lucide-react";
import { toast } from "sonner";

import { CitaForm } from "@/components/agenda/cita-form";
import { SesionForm } from "@/components/pacientes/tabs/sesiones-tab";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { LudaBadge } from "@/components/ui/luda-badge";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useActualizarCita,
  useCambiarEstatusCita,
  useCitasRango,
  useCompletarCita,
  useCrearCita,
  useEliminarCita,
  useReagendarCita,
} from "@/hooks/use-citas";
import { useConfiguracion } from "@/hooks/use-configuracion";
import { usePsicologos } from "@/hooks/use-perfiles";
import { useCrearSesion } from "@/hooks/use-sesiones";
import { TIPO_CITA_LABEL } from "@/types/app.types";
import type { CitaConRelaciones } from "@/types/app.types";
import type { CitaInput } from "@/lib/validations/cita.schema";
import type { SesionInput } from "@/lib/validations/sesion.schema";
import type { EstatusCita } from "@/types/database.types";

const errMsg = (e: unknown, fallback: string) =>
  e instanceof Error ? e.message : fallback;

const HORA_PX = 56; // alto de cada hora en la rejilla
type Vista = "semana" | "dia" | "lista";

/** Lee la hora (entero) de un string "HH:MM[:SS]"; usa fallback si no hay. */
function horaDe(valor: string | null | undefined, fallback: number): number {
  if (!valor) return fallback;
  const h = parseInt(valor.slice(0, 2), 10);
  return Number.isFinite(h) ? h : fallback;
}

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

/** Distribuye las citas de un día en carriles para que no se encimen. */
function carriles(citas: CitaConRelaciones[]) {
  const ordenadas = [...citas].sort(
    (a, b) =>
      new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime(),
  );
  const finCarril: number[] = [];
  const asignado = new Map<string, number>();
  for (const c of ordenadas) {
    const ini = new Date(c.fecha_inicio).getTime();
    const fin = new Date(c.fecha_fin).getTime();
    let carril = finCarril.findIndex((f) => f <= ini);
    if (carril === -1) {
      carril = finCarril.length;
      finCarril.push(fin);
    } else {
      finCarril[carril] = fin;
    }
    asignado.set(c.id, carril);
  }
  return { asignado, totalCarriles: Math.max(1, finCarril.length) };
}

export function AgendaCliente() {
  const [ancla, setAncla] = useState(new Date());
  const [vista, setVista] = useState<Vista>("semana");
  const [filtroPsico, setFiltroPsico] = useState("");
  const [formAbierto, setFormAbierto] = useState(false);
  const [editando, setEditando] = useState<CitaConRelaciones | null>(null);
  const [inicialNueva, setInicialNueva] = useState<Partial<CitaInput>>();
  const [repetirSemanas, setRepetirSemanas] = useState(0);
  // La agenda depende de la fecha/hora actual; se monta en cliente para
  // evitar discrepancias de hidratación entre el servidor y el navegador.
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);
  const [detalle, setDetalle] = useState<CitaConRelaciones | null>(null);
  const [notaPara, setNotaPara] = useState<CitaConRelaciones | null>(null);
  const [motivoPara, setMotivoPara] = useState<{
    cita: CitaConRelaciones;
    estatus: EstatusCita;
  } | null>(null);
  const [motivoTexto, setMotivoTexto] = useState("");

  const { data: config } = useConfiguracion();
  const { data: psicologos = [] } = usePsicologos();
  const confirmar = useConfirm();
  const horaInicio = horaDe(config?.horario_inicio, 8);
  const horaFin = Math.max(horaInicio + 1, horaDe(config?.horario_fin, 20));
  const horas = useMemo(
    () => Array.from({ length: horaFin - horaInicio }, (_, i) => horaInicio + i),
    [horaInicio, horaFin],
  );

  const inicioSemana = useMemo(
    () => startOfWeek(ancla, { weekStartsOn: 1 }),
    [ancla],
  );
  const finSemana = useMemo(() => addDays(inicioSemana, 6), [inicioSemana]);

  const dias = useMemo(() => {
    if (vista === "dia") return [ancla];
    return Array.from({ length: 6 }, (_, i) => addDays(inicioSemana, i)); // Lun-Sáb
  }, [vista, ancla, inicioSemana]);

  const rangoDesde = vista === "dia" ? ancla : inicioSemana;
  const rangoHasta = vista === "dia" ? ancla : finSemana;

  const { data: citas = [], isLoading } = useCitasRango(
    set(rangoDesde, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 }).toISOString(),
    addDays(set(rangoHasta, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 }), 1).toISOString(),
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

  // Resumen del día actual.
  const resumenHoy = useMemo(() => {
    const hoy = visibles.filter((c) => isSameDay(new Date(c.fecha_inicio), new Date()));
    return {
      total: hoy.length,
      confirmadas: hoy.filter((c) => c.estatus === "confirmada").length,
      completadas: hoy.filter((c) => c.estatus === "completada").length,
      pendientes: hoy.filter((c) => c.estatus === "programada").length,
    };
  }, [visibles]);

  async function guardar(valores: CitaInput) {
    try {
      if (editando) {
        await actualizar.mutateAsync({ id: editando.id, input: valores });
        toast.success("Cita actualizada");
        cerrarForm();
        return;
      }
      // Crear la primera y, si aplica, las repeticiones semanales.
      await crear.mutateAsync(valores);
      let creadas = 1;
      let omitidas = 0;
      for (let i = 1; i <= repetirSemanas; i++) {
        const base = new Date(`${valores.fecha}T00:00:00`);
        const fecha = format(addDays(base, 7 * i), "yyyy-MM-dd");
        try {
          await crear.mutateAsync({ ...valores, fecha });
          creadas++;
        } catch {
          omitidas++;
        }
      }
      toast.success(
        repetirSemanas > 0
          ? `${creadas} cita(s) creada(s)${omitidas ? `, ${omitidas} omitida(s) por empalme` : ""}`
          : "Cita creada",
      );
      cerrarForm();
    } catch (e) {
      toast.error(errMsg(e, "No se pudo guardar la cita"));
    }
  }

  function cerrarForm() {
    setFormAbierto(false);
    setEditando(null);
    setInicialNueva(undefined);
    setRepetirSemanas(0);
  }

  function abrirNueva(inicial?: Partial<CitaInput>) {
    setEditando(null);
    setInicialNueva({
      psicologo_id: filtroPsico || undefined,
      ...inicial,
    });
    setFormAbierto(true);
  }

  /** Clic en un hueco de la rejilla → crear cita prellenada con día y hora. */
  function clicEnHueco(dia: Date, e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const min = horaInicio * 60 + Math.floor(y / HORA_PX) * 60;
    const snap = Math.floor((y % HORA_PX) / (HORA_PX / 2)) * 30;
    const total = min + snap;
    abrirNueva({
      fecha: format(dia, "yyyy-MM-dd"),
      hora: `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`,
    });
  }

  /** Soltar una cita en una columna a la altura Y → reagenda a esa hora. */
  async function soltarEnColumna(
    citaId: string,
    dia: Date,
    e: React.DragEvent<HTMLDivElement>,
  ) {
    const c = citas.find((x) => x.id === citaId);
    if (!c) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const minutosCrudos = horaInicio * 60 + (y / HORA_PX) * 60;
    const min = Math.round(minutosCrudos / 15) * 15; // snap a 15 min
    const dur =
      new Date(c.fecha_fin).getTime() - new Date(c.fecha_inicio).getTime();
    const nuevoIni = set(dia, {
      hours: Math.floor(min / 60),
      minutes: min % 60,
      seconds: 0,
      milliseconds: 0,
    });
    const nuevoFin = new Date(nuevoIni.getTime() + dur);
    if (nuevoIni.getTime() === new Date(c.fecha_inicio).getTime()) return;
    try {
      await reagendar.mutateAsync({
        id: c.id,
        psicologoId: c.psicologo_id,
        fechaInicio: nuevoIni.toISOString(),
        fechaFin: nuevoFin.toISOString(),
      });
      toast.success("Cita reagendada");
    } catch (err) {
      toast.error(errMsg(err, "No se pudo reagendar"));
    }
  }

  async function confirmarMotivo(e: React.FormEvent) {
    e.preventDefault();
    if (!motivoPara) return;
    try {
      await cambiarEstatus.mutateAsync({
        id: motivoPara.cita.id,
        estatus: motivoPara.estatus,
        motivo: motivoTexto.trim() || undefined,
      });
      toast.success("Cita actualizada");
      setMotivoPara(null);
      setMotivoTexto("");
      setDetalle(null);
    } catch (err) {
      toast.error(errMsg(err, "No se pudo actualizar"));
    }
  }

  async function setEstatusSimple(c: CitaConRelaciones, estatus: EstatusCita) {
    try {
      await cambiarEstatus.mutateAsync({ id: c.id, estatus });
      setDetalle(null);
      toast.success("Cita actualizada");
    } catch (err) {
      toast.error(errMsg(err, "No se pudo actualizar"));
    }
  }

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

  if (!montado) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-fredoka text-3xl text-luda-gris">Agenda</h1>
        </div>
        <p className="text-sm text-luda-gris-light">Cargando agenda…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra superior */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-fredoka text-3xl text-luda-gris">Agenda</h1>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-xl border border-luda-lila/30">
            <BotonVista actual={vista} valor="semana" onClick={setVista} icon={CalendarRange} label="Semana" />
            <BotonVista actual={vista} valor="dia" onClick={setVista} icon={CalendarDays} label="Día" />
            <BotonVista actual={vista} valor="lista" onClick={setVista} icon={LayoutList} label="Lista" />
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAncla(vista === "dia" ? addDays(ancla, -1) : addWeeks(ancla, -1))}
              aria-label="Anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setAncla(new Date())}>
              Hoy
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAncla(vista === "dia" ? addDays(ancla, 1) : addWeeks(ancla, 1))}
              aria-label="Siguiente"
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
            {psicologosFiltro()}
          </Select>
          <Button size="sm" onClick={() => abrirNueva()}>
            <CalendarPlus className="h-4 w-4" /> Nueva cita
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold capitalize text-luda-gris-light">
          {vista === "dia"
            ? format(ancla, "EEEE d 'de' MMMM yyyy", { locale: es })
            : `${format(inicioSemana, "d 'de' MMM", { locale: es })} — ${format(finSemana, "d 'de' MMM yyyy", { locale: es })}`}
        </p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-luda-gris-light">
          <span><b className="text-luda-gris">{resumenHoy.total}</b> hoy</span>
          <span><b className="text-luda-gris">{resumenHoy.pendientes}</b> por confirmar</span>
          <span><b className="text-luda-gris">{resumenHoy.confirmadas}</b> confirmadas</span>
          <span><b className="text-luda-gris">{resumenHoy.completadas}</b> completadas</span>
        </div>
      </div>

      {isLoading && <p className="text-sm text-luda-gris-light">Cargando agenda…</p>}

      {vista === "lista" ? (
        <VistaLista dias={dias} citas={visibles} onCita={setDetalle} />
      ) : (
        <RejillaHoraria
          dias={dias}
          horas={horas}
          horaInicio={horaInicio}
          citas={visibles}
          onHueco={clicEnHueco}
          onSoltar={soltarEnColumna}
          onCita={setDetalle}
        />
      )}

      {/* Leyenda de terapeutas */}
      <LeyendaTerapeutas />

      {/* Modal crear/editar */}
      <Modal
        abierto={formAbierto}
        onCerrar={cerrarForm}
        titulo={editando ? "Editar cita" : "Nueva cita"}
      >
        {!editando && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-luda-fondo px-3 py-2">
            <label htmlFor="repetir" className="text-sm font-semibold text-luda-gris">
              Repetir semanalmente
            </label>
            <Select
              id="repetir"
              value={String(repetirSemanas)}
              onChange={(e) => setRepetirSemanas(Number(e.target.value))}
              className="h-9 w-auto text-xs"
            >
              <option value="0">No repetir</option>
              <option value="3">3 semanas más</option>
              <option value="5">5 semanas más</option>
              <option value="7">7 semanas más</option>
              <option value="11">11 semanas más</option>
            </Select>
          </div>
        )}
        <CitaForm
          inicial={editando ? citaAInput(editando) : inicialNueva}
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
                {TIPO_CITA_LABEL[detalle.tipo] ?? detalle.tipo} · {detalle.modalidad}
              </p>
            </div>
            <p className="text-sm capitalize text-luda-gris">
              {format(new Date(detalle.fecha_inicio), "EEEE d 'de' MMMM · HH:mm", { locale: es })}{" "}
              — {format(new Date(detalle.fecha_fin), "HH:mm")}
            </p>
            <div className="flex items-center gap-2">
              <LudaBadge tipo="cita" status={detalle.estatus} />
              <span className="flex items-center gap-1.5 text-xs text-luda-gris-light">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: detalle.psicologo?.color_agenda ?? "#C9A8E0" }}
                />
                {detalle.psicologo?.full_name}
              </span>
            </div>
            {detalle.notas_previas && (
              <p className="rounded-xl bg-luda-fondo p-3 text-sm text-luda-gris">
                {detalle.notas_previas}
              </p>
            )}
            {detalle.motivo_cancelacion && (
              <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
                Motivo: {detalle.motivo_cancelacion}
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
              <Button size="sm" variant="outline" onClick={() => setEstatusSimple(detalle, "confirmada")}>
                Confirmar
              </Button>
              <Button size="sm" variant="outline" onClick={() => completarYcobrar(detalle)}>
                Completar y cobrar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setMotivoTexto(""); setMotivoPara({ cita: detalle, estatus: "no_asistio" }); }}
              >
                No asistió
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-500 hover:bg-red-50"
                onClick={() => { setMotivoTexto(""); setMotivoPara({ cita: detalle, estatus: "cancelada" }); }}
              >
                Cancelar cita
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto text-red-500 hover:bg-red-50"
                onClick={async () => {
                  const ok = await confirmar({
                    titulo: "Eliminar cita",
                    mensaje: "¿Eliminar esta cita de la agenda?",
                    confirmar: "Eliminar",
                    peligro: true,
                  });
                  if (!ok) return;
                  try {
                    await eliminar.mutateAsync(detalle.id);
                    setDetalle(null);
                    toast.success("Cita eliminada");
                  } catch (err) {
                    toast.error(errMsg(err, "No se pudo eliminar la cita"));
                  }
                }}
              >
                Eliminar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de motivo (cancelar / no asistió) */}
      <Modal
        abierto={Boolean(motivoPara)}
        onCerrar={() => setMotivoPara(null)}
        titulo={motivoPara?.estatus === "cancelada" ? "Cancelar cita" : "Marcar inasistencia"}
        className="max-w-sm"
      >
        <form onSubmit={confirmarMotivo} className="space-y-4">
          <Textarea
            value={motivoTexto}
            onChange={(e) => setMotivoTexto(e.target.value)}
            placeholder={
              motivoPara?.estatus === "cancelada"
                ? "Motivo de la cancelación (opcional)…"
                : "Nota de la inasistencia (opcional)…"
            }
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setMotivoPara(null)}>
              Cerrar
            </Button>
            <Button
              type="submit"
              variant={motivoPara?.estatus === "cancelada" ? "destructive" : "default"}
              disabled={cambiarEstatus.isPending}
            >
              {motivoPara?.estatus === "cancelada" ? "Cancelar cita" : "Marcar"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de nota tras completar */}
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
            inicial={{ fecha_sesion: format(new Date(notaPara.fecha_inicio), "yyyy-MM-dd") }}
            guardando={crearSesion.isPending}
            onGuardar={guardarNota}
          />
        )}
      </Modal>
    </div>
  );

  function psicologosFiltro() {
    return psicologos.map((p) => (
      <option key={p.id} value={p.id}>
        {p.full_name}
      </option>
    ));
  }
}

function BotonVista({
  actual,
  valor,
  onClick,
  icon: Icon,
  label,
}: {
  actual: Vista;
  valor: Vista;
  onClick: (v: Vista) => void;
  icon: typeof CalendarDays;
  label: string;
}) {
  const activo = actual === valor;
  return (
    <button
      type="button"
      onClick={() => onClick(valor)}
      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors ${
        activo ? "bg-luda-lila text-white" : "bg-white text-luda-gris-light hover:bg-luda-lila-light"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function LeyendaTerapeutas() {
  const { data: psicologos = [] } = usePsicologos();
  if (psicologos.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-3 pt-1">
      {psicologos.map((p) => (
        <span key={p.id} className="flex items-center gap-1.5 text-xs text-luda-gris-light">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: p.color_agenda }}
          />
          {p.full_name}
        </span>
      ))}
    </div>
  );
}

function RejillaHoraria({
  dias,
  horas,
  horaInicio,
  citas,
  onHueco,
  onSoltar,
  onCita,
}: {
  dias: Date[];
  horas: number[];
  horaInicio: number;
  citas: CitaConRelaciones[];
  onHueco: (dia: Date, e: React.MouseEvent<HTMLDivElement>) => void;
  onSoltar: (citaId: string, dia: Date, e: React.DragEvent<HTMLDivElement>) => void;
  onCita: (c: CitaConRelaciones) => void;
}) {
  const altura = horas.length * HORA_PX;
  return (
    <div className="overflow-x-auto rounded-2xl border border-luda-lila/15 bg-white">
      <div className="flex min-w-[640px]">
        {/* Columna de horas */}
        <div className="w-14 shrink-0 pt-10">
          {horas.map((h) => (
            <div
              key={h}
              style={{ height: HORA_PX }}
              className="relative -top-2 pr-2 text-right text-[11px] font-semibold text-luda-gris-light"
            >
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {/* Columnas de días */}
        <div className="flex flex-1">
          {dias.map((dia) => {
            const delDia = citas.filter((c) => isSameDay(new Date(c.fecha_inicio), dia));
            const { asignado, totalCarriles } = carriles(delDia);
            const esHoy = isSameDay(dia, new Date());
            return (
              <div key={dia.toISOString()} className="flex-1 border-l border-luda-lila/10">
                <div className={`sticky top-0 z-10 h-10 px-2 py-1.5 text-center ${esHoy ? "bg-luda-lila text-white" : "bg-white text-luda-gris"}`}>
                  <p className="text-[11px] font-semibold uppercase leading-tight">
                    {format(dia, "EEE", { locale: es })}
                  </p>
                  <p className="font-fredoka text-sm leading-none">{format(dia, "d")}</p>
                </div>
                <div
                  className="relative"
                  style={{ height: altura }}
                  onClick={(e) => onHueco(dia, e)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onSoltar(e.dataTransfer.getData("text/plain"), dia, e)}
                >
                  {/* Líneas de hora */}
                  {horas.map((h) => (
                    <div
                      key={h}
                      style={{ height: HORA_PX }}
                      className="border-t border-luda-lila/10"
                    />
                  ))}
                  {/* Citas */}
                  {delDia.map((c) => {
                    const ini = new Date(c.fecha_inicio);
                    const fin = new Date(c.fecha_fin);
                    const top = ((ini.getHours() * 60 + ini.getMinutes()) - horaInicio * 60) / 60 * HORA_PX;
                    const alto = Math.max(((fin.getTime() - ini.getTime()) / 60000) / 60 * HORA_PX, 24);
                    const carril = asignado.get(c.id) ?? 0;
                    const ancho = 100 / totalCarriles;
                    const cancelada = c.estatus === "cancelada" || c.estatus === "no_asistio";
                    return (
                      <button
                        key={c.id}
                        type="button"
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("text/plain", c.id)}
                        onClick={(e) => { e.stopPropagation(); onCita(c); }}
                        className={`absolute overflow-hidden rounded-lg border-l-4 p-1 text-left shadow-sm transition-colors hover:brightness-95 ${cancelada ? "opacity-60 line-through" : ""}`}
                        style={{
                          top: top + 2,
                          height: alto - 4,
                          left: `calc(${carril * ancho}% + 2px)`,
                          width: `calc(${ancho}% - 4px)`,
                          backgroundColor: (c.psicologo?.color_agenda ?? "#C9A8E0") + "26",
                          borderLeftColor: c.psicologo?.color_agenda ?? "#C9A8E0",
                        }}
                      >
                        <p className="flex items-center gap-1 text-[10px] font-bold text-luda-gris">
                          <Clock className="h-2.5 w-2.5" />
                          {format(ini, "HH:mm")}
                          {c.modalidad === "videollamada" && <Video className="h-2.5 w-2.5" />}
                        </p>
                        <p className="truncate text-[11px] font-semibold text-luda-gris">
                          {c.paciente?.nombre} {c.paciente?.apellido_paterno}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function VistaLista({
  dias,
  citas,
  onCita,
}: {
  dias: Date[];
  citas: CitaConRelaciones[];
  onCita: (c: CitaConRelaciones) => void;
}) {
  return (
    <div className="space-y-4">
      {dias.map((dia) => {
        const delDia = citas
          .filter((c) => isSameDay(new Date(c.fecha_inicio), dia))
          .sort((a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime());
        if (delDia.length === 0) return null;
        return (
          <div key={dia.toISOString()}>
            <p className="mb-2 text-sm font-bold capitalize text-luda-gris">
              {format(dia, "EEEE d 'de' MMMM", { locale: es })}
            </p>
            <div className="space-y-2">
              {delDia.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onCita(c)}
                  className="flex w-full items-center gap-3 rounded-xl border border-luda-lila/15 bg-white p-3 text-left transition-colors hover:bg-luda-lila-light"
                >
                  <span
                    className="h-10 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: c.psicologo?.color_agenda ?? "#C9A8E0" }}
                  />
                  <span className="w-24 shrink-0 text-sm font-bold text-luda-gris">
                    {format(new Date(c.fecha_inicio), "HH:mm")}–{format(new Date(c.fecha_fin), "HH:mm")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-luda-gris">
                      {c.paciente?.nombre} {c.paciente?.apellido_paterno}
                    </span>
                    <span className="block truncate text-xs text-luda-gris-light">
                      {TIPO_CITA_LABEL[c.tipo] ?? c.tipo} · {c.psicologo?.full_name}
                    </span>
                  </span>
                  <LudaBadge tipo="cita" status={c.estatus} />
                </button>
              ))}
            </div>
          </div>
        );
      })}
      {citas.length === 0 && (
        <p className="rounded-2xl border border-luda-lila/15 bg-white p-6 text-center text-sm text-luda-gris-light">
          No hay citas en este periodo.
        </p>
      )}
    </div>
  );
}
