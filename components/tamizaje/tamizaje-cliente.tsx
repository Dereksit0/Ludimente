"use client";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ClipboardCheck,
  FileEdit,
  Plus,
  Printer,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Label } from "@/components/ui/label";
import { LudaCard } from "@/components/ui/luda-card";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useConfiguracion } from "@/hooks/use-configuracion";
import { usePacientes } from "@/hooks/use-pacientes";
import { usePsicologos } from "@/hooks/use-perfiles";
import {
  useTamizajes,
  useCrearTamizaje,
  useActualizarTamizaje,
  useEliminarTamizaje,
  type TamizajeItem,
} from "@/hooks/use-tamizaje";
import {
  NIVEL_TAMIZAJE_CLASES,
  NIVEL_TAMIZAJE_LABEL,
  NIVEL_TAMIZAJE_OPCIONES,
  TAMIZAJE_AREAS,
} from "@/lib/catalogos";
import { imprimirTamizaje } from "@/lib/print-tamizaje";
import { imprimirPropuesta } from "@/lib/print-propuesta";
import { generarPropuesta } from "@/lib/propuesta";
import { createClient } from "@/lib/supabase/client";

const hoy = () => new Date().toISOString().slice(0, 10);

export function TamizajeCliente() {
  const { data: tamizajes = [], isLoading } = useTamizajes();
  const { data: pacientes = [] } = usePacientes();
  const { data: config } = useConfiguracion();
  const eliminar = useEliminarTamizaje();
  const confirmar = useConfirm();

  const [editar, setEditar] = useState<TamizajeItem | null>(null);
  const [crearPara, setCrearPara] = useState<string | null>(null); // paciente_id o ""
  const [abierto, setAbierto] = useState(false);
  const [propuestaDe, setPropuestaDe] = useState<TamizajeItem | null>(null);

  // Último tamizaje por paciente (la lista viene ordenada por fecha desc).
  const ultimoPorPaciente = useMemo(() => {
    const m = new Map<string, TamizajeItem>();
    for (const t of tamizajes) if (!m.has(t.paciente_id)) m.set(t.paciente_id, t);
    return m;
  }, [tamizajes]);

  // Filas: todos los pacientes, con su último tamizaje (o ninguno).
  const filas = useMemo(
    () =>
      pacientes.map((p) => ({
        paciente: p,
        nombre: `${p.nombre} ${p.apellido_paterno}`,
        tamizaje: ultimoPorPaciente.get(p.id) ?? null,
      })),
    [pacientes, ultimoPorPaciente],
  );

  const resumen = useMemo(() => {
    const evaluados = filas.filter((f) => f.tamizaje).length;
    return { evaluados, sin: filas.length - evaluados, total: filas.length };
  }, [filas]);

  function nuevo(pacienteId?: string) {
    setEditar(null);
    setCrearPara(pacienteId ?? "");
    setAbierto(true);
  }

  async function borrar(t: TamizajeItem) {
    const ok = await confirmar({
      titulo: "Eliminar tamizaje",
      mensaje: `¿Eliminar el tamizaje de ${t.paciente_nombre}?`,
      confirmar: "Eliminar",
      peligro: true,
    });
    if (!ok) return;
    await eliminar.mutateAsync(t.id);
    toast.success("Tamizaje eliminado");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-fredoka text-3xl text-luda-gris">
            Tamizaje inicial
          </h1>
          <p className="mt-1 text-sm text-luda-gris-light">
            Nivel base de cada paciente por área para ver de un vistazo cómo
            viene todo el grupo.
          </p>
        </div>
        <Button size="sm" onClick={() => nuevo()}>
          <Plus className="h-4 w-4" /> Nuevo tamizaje
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-green-100 px-2.5 py-1 font-semibold text-green-700">
          {resumen.evaluados} evaluados
        </span>
        <span className="rounded-full bg-gray-100 px-2.5 py-1 font-semibold text-gray-500">
          {resumen.sin} sin tamizaje
        </span>
        <span className="rounded-full bg-luda-lila-light px-2.5 py-1 font-semibold text-luda-lila-dark">
          {resumen.total} pacientes
        </span>
      </div>

      {isLoading && <p className="text-sm text-luda-gris-light">Cargando…</p>}

      <LudaCard className="overflow-x-auto p-0">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-luda-lila-light text-luda-gris">
              <th className="sticky left-0 z-10 bg-luda-lila-light p-2.5 text-left font-bold">
                Paciente
              </th>
              {TAMIZAJE_AREAS.map((a) => (
                <th
                  key={a.value}
                  className="p-2 text-center font-semibold"
                  title={a.label}
                >
                  {a.label.split(" / ")[0]}
                </th>
              ))}
              <th className="p-2.5 text-center font-bold">Fecha</th>
              <th className="p-2.5" />
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.paciente.id} className="border-t border-luda-lila/15">
                <td className="sticky left-0 z-10 bg-white p-2.5 font-bold text-luda-gris">
                  {f.nombre}
                </td>
                {TAMIZAJE_AREAS.map((a) => {
                  const nivel = f.tamizaje?.areasMap[a.value] ?? "no_evaluado";
                  return (
                    <td key={a.value} className="p-1.5 text-center">
                      <span
                        className={`inline-block w-full rounded px-1.5 py-1 text-[10px] font-semibold ${
                          NIVEL_TAMIZAJE_CLASES[nivel] ??
                          NIVEL_TAMIZAJE_CLASES.no_evaluado
                        }`}
                        title={NIVEL_TAMIZAJE_LABEL[nivel]}
                      >
                        {nivel === "no_evaluado"
                          ? "—"
                          : nivel === "logrado"
                            ? "L"
                            : nivel === "en_proceso"
                              ? "P"
                              : "NL"}
                      </span>
                    </td>
                  );
                })}
                <td className="whitespace-nowrap p-2.5 text-center text-luda-gris-light">
                  {f.tamizaje
                    ? format(new Date(f.tamizaje.fecha), "d MMM yy", { locale: es })
                    : "—"}
                </td>
                <td className="whitespace-nowrap p-2">
                  {f.tamizaje ? (
                    <div className="flex gap-0.5">
                      <button
                        onClick={() => setPropuestaDe(f.tamizaje)}
                        aria-label="Generar propuesta"
                        title="Generar propuesta de intervención"
                        className="rounded-lg p-1.5 text-luda-lila-dark hover:bg-luda-lila-light"
                      >
                        <Sparkles className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => imprimirTamizaje(f.tamizaje!, config)}
                        aria-label="Imprimir"
                        className="rounded-lg p-1.5 text-luda-gris-light hover:bg-luda-lila-light hover:text-luda-lila-dark"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditar(f.tamizaje);
                          setCrearPara(null);
                          setAbierto(true);
                        }}
                        aria-label="Editar"
                        className="rounded-lg p-1.5 text-luda-gris-light hover:bg-luda-lila-light hover:text-luda-lila-dark"
                      >
                        <FileEdit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => borrar(f.tamizaje!)}
                        aria-label="Eliminar"
                        className="rounded-lg p-1.5 text-luda-gris-light hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => nuevo(f.paciente.id)}
                    >
                      <ClipboardCheck className="h-3.5 w-3.5" /> Evaluar
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {filas.length === 0 && (
              <tr>
                <td colSpan={TAMIZAJE_AREAS.length + 3} className="p-6 text-center text-luda-gris-light">
                  No hay pacientes registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </LudaCard>

      <p className="text-xs text-luda-gris-light">
        L = Logrado · P = En proceso · NL = No logrado · — = No evaluado
      </p>

      {abierto && (
        <ModalTamizaje
          inicial={editar}
          pacienteFijo={crearPara}
          onCerrar={() => {
            setAbierto(false);
            setEditar(null);
            setCrearPara(null);
          }}
        />
      )}

      {propuestaDe && (
        <ModalPropuesta
          tamizaje={propuestaDe}
          onCerrar={() => setPropuestaDe(null)}
        />
      )}
    </div>
  );
}

function ModalPropuesta({
  tamizaje,
  onCerrar,
}: {
  tamizaje: TamizajeItem;
  onCerrar: () => void;
}) {
  const { data: config } = useConfiguracion();
  const qc = useQueryClient();
  const router = useRouter();
  const [creando, setCreando] = useState(false);

  const propuesta = useMemo(
    () =>
      generarPropuesta(tamizaje.areasMap, {
        precioBase: config?.precio_sesion_default ?? 0,
        duracionMin: config?.duracion_sesion_mins ?? 50,
        moneda: config?.moneda ?? "MXN",
      }),
    [tamizaje.areasMap, config],
  );

  const money = (n: number) =>
    `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })} ${propuesta.moneda}`;

  async function crearPlan() {
    setCreando(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: plan, error } = await supabase
        .from("planes_intervencion")
        .insert({
          paciente_id: tamizaje.paciente_id,
          psicologo_id: user?.id ?? tamizaje.evaluador_id ?? null,
          titulo: `Plan de intervención — ${tamizaje.paciente_nombre}`,
          diagnostico_base: "Generado a partir del tamizaje inicial",
          descripcion: `Plan sugerido por el sistema según los resultados del tamizaje (${propuesta.sesiones} sesiones, ${propuesta.frecuencia}/semana).`,
          created_by: user?.id ?? null,
        })
        .select("id")
        .single();
      if (error || !plan) throw error;

      if (propuesta.objetivos.length) {
        const filas = propuesta.objetivos.map((o, i) => ({
          plan_id: plan.id,
          descripcion: o.descripcion,
          area: o.areaObjetivo,
          prioridad: o.prioridad,
          orden: i,
        }));
        const { error: e2 } = await supabase
          .from("objetivos_intervencion")
          .insert(filas);
        if (e2) throw e2;
      }

      await qc.invalidateQueries({ queryKey: ["planes"] });
      toast.success("Plan de intervención creado");
      router.push(`/planes/${plan.id}`);
    } catch {
      toast.error("No se pudo crear el plan (revisa permisos: admin o terapeuta)");
    } finally {
      setCreando(false);
    }
  }

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo={`Propuesta — ${tamizaje.paciente_nombre}`}
      className="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Objetivos sugeridos */}
        <section>
          <h3 className="text-sm font-bold text-luda-gris">
            Plan de intervención sugerido
          </h3>
          {propuesta.objetivos.length === 0 ? (
            <p className="mt-1 text-sm text-luda-gris-light">
              El paciente muestra desempeño adecuado en las áreas evaluadas; se
              sugiere seguimiento.
            </p>
          ) : (
            <ul className="mt-1.5 space-y-1.5">
              {propuesta.objetivos.map((o, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-luda-gris">
                  <span
                    className={`mt-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      o.prioridad === "alta"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {o.prioridad}
                  </span>
                  <span>
                    {o.descripcion}{" "}
                    <span className="text-luda-gris-light">· {o.areaLabel}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Sesiones */}
        <section className="rounded-xl bg-luda-lila-light/50 p-3 text-sm text-luda-gris">
          <h3 className="text-sm font-bold">Plan de sesiones</h3>
          <p className="mt-1">
            <strong>{propuesta.sesiones} sesiones</strong> de{" "}
            {propuesta.duracionMin} min · {propuesta.frecuencia} por semana
            (~{propuesta.semanas} semanas).
          </p>
        </section>

        {/* Pagos */}
        <section className="rounded-xl border border-luda-lila/20 p-3">
          <h3 className="text-sm font-bold text-luda-gris">Plan de pagos</h3>
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-luda-gris-light">
                Precio por sesión (en el sistema)
              </span>
              <span className="font-bold text-luda-gris">
                {money(propuesta.precioLista)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-luda-gris-light">Mensualidad estimada</span>
              <span className="font-semibold text-luda-gris">
                {money(propuesta.mensualidad)}
              </span>
            </div>
            <div className="flex justify-between border-t border-luda-lila/15 pt-1">
              <span className="text-luda-gris-light">
                Total del programa ({propuesta.sesiones} sesiones)
              </span>
              <span className="font-bold text-luda-lila-dark">
                {money(propuesta.totalLista)}
              </span>
            </div>
          </div>
          <p className="mt-2 rounded-lg bg-yellow-50 px-2.5 py-1.5 text-xs text-yellow-800">
            🔒 Solo personal: precio base{" "}
            <strong>{money(propuesta.precioBase)}</strong>/sesión (total{" "}
            {money(propuesta.totalBase)}). El sistema muestra el precio de lista;
            ofrece el descuento que decidas de viva voz.
          </p>
        </section>

        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onCerrar}>
            Cerrar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              imprimirPropuesta(propuesta, tamizaje.paciente_nombre, config)
            }
          >
            <Printer className="h-4 w-4" /> Imprimir propuesta
          </Button>
          <Button type="button" onClick={crearPlan} disabled={creando}>
            <Sparkles className="h-4 w-4" />
            {creando ? "Creando…" : "Crear plan de intervención"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ModalTamizaje({
  inicial,
  pacienteFijo,
  onCerrar,
}: {
  inicial: TamizajeItem | null;
  pacienteFijo: string | null;
  onCerrar: () => void;
}) {
  const { data: pacientes = [] } = usePacientes();
  const { data: terapeutas = [] } = usePsicologos();
  const crear = useCrearTamizaje();
  const actualizar = useActualizarTamizaje();

  const [pacienteId, setPacienteId] = useState(
    inicial?.paciente_id ?? pacienteFijo ?? "",
  );
  const [evaluadorId, setEvaluadorId] = useState(inicial?.evaluador_id ?? "");
  const [fecha, setFecha] = useState(inicial?.fecha ?? hoy());
  const [observaciones, setObservaciones] = useState(
    inicial?.observaciones ?? "",
  );
  const [areas, setAreas] = useState<Record<string, string>>(
    inicial?.areasMap ?? {},
  );

  const setArea = (k: string, v: string) =>
    setAreas((prev) => ({ ...prev, [k]: v }));

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!pacienteId) {
      toast.error("Selecciona un paciente");
      return;
    }
    const payload = {
      paciente_id: pacienteId,
      evaluador_id: evaluadorId || null,
      fecha,
      areas,
      observaciones: observaciones.trim() || null,
    };
    try {
      if (inicial) {
        await actualizar.mutateAsync({ id: inicial.id, cambios: payload });
        toast.success("Tamizaje actualizado");
      } else {
        await crear.mutateAsync(payload);
        toast.success("Tamizaje guardado");
      }
      onCerrar();
    } catch {
      toast.error("No se pudo guardar (revisa permisos: admin o terapeuta)");
    }
  }

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo={inicial ? "Editar tamizaje" : "Nuevo tamizaje"}
      className="max-w-2xl"
    >
      <form onSubmit={guardar} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="pac">Paciente</Label>
            <Select
              id="pac"
              value={pacienteId}
              onChange={(e) => setPacienteId(e.target.value)}
              disabled={Boolean(inicial)}
              required
            >
              <option value="" disabled>
                Selecciona…
              </option>
              {pacientes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} {p.apellido_paterno} · {p.numero_expediente}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ev">Evaluador(a)</Label>
            <Select
              id="ev"
              value={evaluadorId}
              onChange={(e) => setEvaluadorId(e.target.value)}
            >
              <option value="">Sin asignar</option>
              {terapeutas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fec">Fecha</Label>
            <Input
              id="fec"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label>Nivel por área</Label>
          <div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {TAMIZAJE_AREAS.map((a) => (
              <div
                key={a.value}
                className="flex items-center justify-between gap-2 rounded-lg border border-luda-lila/15 px-3 py-1.5"
              >
                <span className="text-sm text-luda-gris">{a.label}</span>
                <Select
                  value={areas[a.value] ?? "no_evaluado"}
                  onChange={(e) => setArea(a.value, e.target.value)}
                  className="h-8 w-auto text-xs"
                >
                  {NIVEL_TAMIZAJE_OPCIONES.map((n) => (
                    <option key={n.value} value={n.value}>
                      {n.label}
                    </option>
                  ))}
                </Select>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="obs">Observaciones</Label>
          <Textarea
            id="obs"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={crear.isPending || actualizar.isPending}>
            {crear.isPending || actualizar.isPending ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
