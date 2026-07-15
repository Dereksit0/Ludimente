"use client";

import { useMemo, useState } from "react";

import { CalendarRange, FileEdit, Plus, Printer, Trash2 } from "lucide-react";
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
import { usePsicologos } from "@/hooks/use-perfiles";
import {
  usePlaneaciones,
  useCrearPlaneacion,
  useActualizarPlaneacion,
  useEliminarPlaneacion,
  type PlaneacionItem,
} from "@/hooks/use-planeacion";
import { DIAS_SEMANA } from "@/lib/catalogos";
import { imprimirPlaneacion } from "@/lib/print-planeacion";

/** Día de la semana actual en formato 1=Lunes … 7=Domingo. */
function diaHoy(): number {
  const js = new Date().getDay(); // 0=Dom … 6=Sáb
  return js === 0 ? 7 : js;
}

function Lista({ texto }: { texto: string | null }) {
  const items = (texto ?? "")
    .split("\n")
    .map((l) => l.replace(/^[-•·\s]+/, "").trim())
    .filter(Boolean);
  if (items.length === 0) return <span className="text-luda-gris-light">—</span>;
  return (
    <ul className="list-disc space-y-0.5 pl-4">
      {items.map((i, idx) => (
        <li key={idx}>{i}</li>
      ))}
    </ul>
  );
}

export function PlaneacionCliente() {
  const { data: planes = [], isLoading } = usePlaneaciones();
  const { data: config } = useConfiguracion();
  const eliminar = useEliminarPlaneacion();
  const confirmar = useConfirm();

  const [dia, setDia] = useState<number>(diaHoy());
  const [editar, setEditar] = useState<PlaneacionItem | null>(null);
  const [crear, setCrear] = useState(false);

  const delDia = useMemo(
    () => planes.filter((p) => p.dia_semana === dia),
    [planes, dia],
  );

  async function borrar(p: PlaneacionItem) {
    const ok = await confirmar({
      titulo: "Eliminar planeación",
      mensaje: `¿Eliminar la planeación de ${p.paciente_nombre}?`,
      confirmar: "Eliminar",
      peligro: true,
    });
    if (!ok) return;
    await eliminar.mutateAsync(p.id);
    toast.success("Planeación eliminada");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-fredoka text-3xl text-luda-gris">
            Planeación semanal
          </h1>
          <p className="mt-1 text-sm text-luda-gris-light">
            El plan de cada paciente para que cualquier terapeuta pueda cubrir.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => imprimirPlaneacion(planes, config)}
            disabled={planes.length === 0}
          >
            <Printer className="h-4 w-4" /> Imprimir semana
          </Button>
          <Button size="sm" onClick={() => setCrear(true)}>
            <Plus className="h-4 w-4" /> Nueva planeación
          </Button>
        </div>
      </div>

      {/* Selector de día */}
      <div className="flex flex-wrap gap-1.5">
        {DIAS_SEMANA.map((d) => {
          const n = planes.filter((p) => p.dia_semana === d.value).length;
          return (
            <button
              key={d.value}
              onClick={() => setDia(d.value)}
              className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors ${
                dia === d.value
                  ? "bg-luda-lila text-white shadow-luda"
                  : "bg-luda-lila-light text-luda-gris hover:bg-luda-lila/30"
              }`}
            >
              {d.label}
              {n > 0 && (
                <span
                  className={`ml-1.5 rounded-full px-1.5 text-xs ${
                    dia === d.value
                      ? "bg-white/25"
                      : "bg-white text-luda-lila-dark"
                  }`}
                >
                  {n}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {isLoading && <p className="text-sm text-luda-gris-light">Cargando…</p>}

      {!isLoading && delDia.length === 0 && (
        <LudaCard className="p-8 text-center">
          <CalendarRange className="mx-auto h-10 w-10 text-luda-lila" />
          <p className="mt-3 font-semibold text-luda-gris">
            Sin planeaciones para este día
          </p>
          <p className="mt-1 text-sm text-luda-gris-light">
            Agrega el plan de un paciente con el botón “Nueva planeación”.
          </p>
        </LudaCard>
      )}

      {delDia.length > 0 && (
        <LudaCard className="overflow-x-auto p-0">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-luda-rosa-light text-left text-luda-gris">
                <th className="p-2.5 font-bold">Horario</th>
                <th className="p-2.5 font-bold">Paciente</th>
                <th className="p-2.5 font-bold">Objetivos</th>
                <th className="p-2.5 font-bold">Inicio</th>
                <th className="p-2.5 font-bold">Desarrollo</th>
                <th className="p-2.5 font-bold">Cierre</th>
                <th className="p-2.5 font-bold">Materiales</th>
                <th className="p-2.5" />
              </tr>
            </thead>
            <tbody>
              {delDia.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-luda-lila/15 align-top text-luda-gris"
                >
                  <td className="whitespace-nowrap p-2.5 text-center font-bold">
                    {p.horario || "—"}
                  </td>
                  <td className="p-2.5 font-bold">
                    {p.paciente_nombre}
                    {p.terapeuta_nombre && (
                      <span className="block font-normal text-luda-gris-light">
                        {p.terapeuta_nombre}
                      </span>
                    )}
                  </td>
                  <td className="p-2.5">
                    <Lista texto={p.objetivos} />
                  </td>
                  <td className="p-2.5">{p.inicio || "—"}</td>
                  <td className="p-2.5">
                    <Lista texto={p.desarrollo} />
                  </td>
                  <td className="p-2.5">{p.cierre || "—"}</td>
                  <td className="p-2.5">
                    <Lista texto={p.materiales} />
                  </td>
                  <td className="whitespace-nowrap p-2.5">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditar(p)}
                        aria-label="Editar"
                        className="rounded-lg p-1.5 text-luda-gris-light hover:bg-luda-lila-light hover:text-luda-lila-dark"
                      >
                        <FileEdit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => borrar(p)}
                        aria-label="Eliminar"
                        className="rounded-lg p-1.5 text-luda-gris-light hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </LudaCard>
      )}

      {(crear || editar) && (
        <ModalPlaneacion
          inicial={editar}
          diaDefault={dia}
          onCerrar={() => {
            setCrear(false);
            setEditar(null);
          }}
        />
      )}
    </div>
  );
}

function ModalPlaneacion({
  inicial,
  diaDefault,
  onCerrar,
}: {
  inicial: PlaneacionItem | null;
  diaDefault: number;
  onCerrar: () => void;
}) {
  const { data: pacientes = [] } = usePacientes();
  const { data: terapeutas = [] } = usePsicologos();
  const crear = useCrearPlaneacion();
  const actualizar = useActualizarPlaneacion();

  const [f, setF] = useState({
    paciente_id: inicial?.paciente_id ?? "",
    terapeuta_id: inicial?.terapeuta_id ?? "",
    dia_semana: inicial?.dia_semana ?? diaDefault,
    horario: inicial?.horario ?? "",
    objetivos: inicial?.objetivos ?? "",
    inicio: inicial?.inicio ?? "Saludo (10 min)",
    desarrollo: inicial?.desarrollo ?? "",
    cierre: inicial?.cierre ?? "",
    materiales: inicial?.materiales ?? "",
    notas: inicial?.notas ?? "",
  });

  const set = (k: keyof typeof f, v: string | number) =>
    setF((prev) => ({ ...prev, [k]: v }));

  const { limpiar } = useDraftState({
    clave: `draft:planeacion:${inicial?.id ?? "nueva"}`,
    activo: true,
    valores: f,
    onRestaurar: setF,
  });

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!f.paciente_id) {
      toast.error("Selecciona un paciente");
      return;
    }
    const payload = {
      paciente_id: f.paciente_id,
      terapeuta_id: f.terapeuta_id || null,
      dia_semana: Number(f.dia_semana),
      horario: f.horario.trim() || null,
      objetivos: f.objetivos.trim() || null,
      inicio: f.inicio.trim() || null,
      desarrollo: f.desarrollo.trim() || null,
      cierre: f.cierre.trim() || null,
      materiales: f.materiales.trim() || null,
      notas: f.notas.trim() || null,
    };
    try {
      if (inicial) {
        await actualizar.mutateAsync({ id: inicial.id, cambios: payload });
        toast.success("Planeación actualizada");
      } else {
        await crear.mutateAsync(payload);
        toast.success("Planeación creada");
      }
      limpiar();
      onCerrar();
    } catch {
      toast.error("No se pudo guardar (revisa permisos: admin o terapeuta)");
    }
  }

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo={inicial ? "Editar planeación" : "Nueva planeación"}
      className="max-w-2xl"
    >
      <form onSubmit={guardar} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="pac">Paciente</Label>
            <Select
              id="pac"
              value={f.paciente_id}
              onChange={(e) => set("paciente_id", e.target.value)}
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
            <Label htmlFor="ter">Terapeuta titular</Label>
            <Select
              id="ter"
              value={f.terapeuta_id}
              onChange={(e) => set("terapeuta_id", e.target.value)}
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
            <Label htmlFor="dia">Día</Label>
            <Select
              id="dia"
              value={f.dia_semana}
              onChange={(e) => set("dia_semana", Number(e.target.value))}
            >
              {DIAS_SEMANA.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hora">Horario</Label>
            <Input
              id="hora"
              value={f.horario}
              onChange={(e) => set("horario", e.target.value)}
              placeholder="Ej. 3:00 PM"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="obj">Objetivos (uno por línea)</Label>
          <Textarea
            id="obj"
            value={f.objetivos}
            onChange={(e) => set("objetivos", e.target.value)}
            className="min-h-[90px]"
            placeholder={"Ubicación tempo-espacial\nAgarre trípode\nEscritura 1-10"}
          />
          <RedactarBoton
            valor={f.objetivos}
            contexto="Lista de objetivos de planeación semanal, un objetivo por línea: conserva ese formato de lista"
            onRedactado={(t) => set("objetivos", t)}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ini">Inicio</Label>
            <Input
              id="ini"
              value={f.inicio}
              onChange={(e) => set("inicio", e.target.value)}
              placeholder="Saludo (10 min)"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cie">Cierre</Label>
            <Input
              id="cie"
              value={f.cierre}
              onChange={(e) => set("cierre", e.target.value)}
              placeholder="Actividad en hoja"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="des">Desarrollo (uno por línea)</Label>
          <Textarea
            id="des"
            value={f.desarrollo}
            onChange={(e) => set("desarrollo", e.target.value)}
            className="min-h-[80px]"
          />
          <RedactarBoton
            valor={f.desarrollo}
            contexto="Lista de desarrollo de la sesión en planeación semanal, un paso por línea: conserva ese formato de lista"
            onRedactado={(t) => set("desarrollo", t)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="mat">Materiales (uno por línea)</Label>
          <Textarea
            id="mat"
            value={f.materiales}
            onChange={(e) => set("materiales", e.target.value)}
            className="min-h-[70px]"
          />
          <RedactarBoton
            valor={f.materiales}
            contexto="Lista de materiales de planeación semanal, uno por línea: conserva ese formato de lista"
            onRedactado={(t) => set("materiales", t)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notas">Notas (opcional)</Label>
          <Textarea
            id="notas"
            value={f.notas}
            onChange={(e) => set("notas", e.target.value)}
            placeholder="Observaciones para quien cubra la sesión…"
            className="min-h-[60px]"
          />
          <RedactarBoton
            valor={f.notas}
            contexto="Notas de planeación semanal para quien cubra la sesión"
            onRedactado={(t) => set("notas", t)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={crear.isPending || actualizar.isPending}
          >
            {crear.isPending || actualizar.isPending ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
