"use client";

import { useMemo, useState } from "react";

import { CalendarClock, Pencil, Search, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LudaAvatar } from "@/components/ui/luda-avatar";
import { LudaCard } from "@/components/ui/luda-card";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import {
  useActualizarTerapeuta,
  usePacientesAsignacion,
  useReasignarPaciente,
  useTerapeutas,
  type Terapeuta,
} from "@/hooks/use-terapeutas";
import { ROL_LABEL } from "@/types/app.types";
import type { Rol } from "@/types/database.types";

export function TerapeutasCliente() {
  const { data: terapeutas = [], isLoading } = useTerapeutas();
  const [editar, setEditar] = useState<Terapeuta | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-fredoka text-3xl text-luda-gris">Terapeutas</h1>
        <p className="mt-1 text-sm text-luda-gris-light">
          Carga de pacientes, especialidad y reasignación del equipo clínico.
        </p>
      </div>

      {isLoading && <p className="text-sm text-luda-gris-light">Cargando…</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {terapeutas.map((t) => (
          <TerapeutaCard key={t.id} t={t} onEditar={() => setEditar(t)} />
        ))}
      </div>

      <ReasignacionSection terapeutas={terapeutas} />

      {editar && (
        <ModalEditar terapeuta={editar} onCerrar={() => setEditar(null)} />
      )}
    </div>
  );
}

function TerapeutaCard({ t, onEditar }: { t: Terapeuta; onEditar: () => void }) {
  const ocupacion =
    t.cupo_maximo > 0
      ? Math.min(100, Math.round((t.pacientes_activos / t.cupo_maximo) * 100))
      : 0;
  const lleno = t.pacientes_activos >= t.cupo_maximo;

  return (
    <LudaCard className="p-5">
      <div className="flex items-start gap-3">
        <LudaAvatar nombre={t.full_name} foto={t.avatar_url} size={46} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-bold text-luda-gris">{t.full_name}</h3>
          <p className="truncate text-xs font-semibold text-luda-gris-light">
            {ROL_LABEL[t.role as Rol]}
            {t.especialidad ? ` · ${t.especialidad}` : ""}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Editar terapeuta"
          onClick={onEditar}
          className="h-8 w-8 text-luda-gris-light hover:text-luda-lila-dark"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-2 text-luda-gris">
          <Users className="h-4 w-4 text-luda-lila" />
          <span className="font-bold">{t.pacientes_activos}</span> pacientes
        </div>
        <div className="flex items-center gap-2 text-luda-gris">
          <CalendarClock className="h-4 w-4 text-luda-azul" />
          <span className="font-bold">{t.citas_mes}</span> citas/mes
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs text-luda-gris-light">
          <span>Ocupación</span>
          <span className={lleno ? "font-bold text-red-500" : "font-semibold"}>
            {t.pacientes_activos}/{t.cupo_maximo}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-luda-lila-light">
          <div
            className={`h-full rounded-full ${lleno ? "bg-red-400" : "bg-luda-lila"}`}
            style={{ width: `${ocupacion}%` }}
          />
        </div>
      </div>
    </LudaCard>
  );
}

function ModalEditar({
  terapeuta,
  onCerrar,
}: {
  terapeuta: Terapeuta;
  onCerrar: () => void;
}) {
  const actualizar = useActualizarTerapeuta();
  const [especialidad, setEspecialidad] = useState(terapeuta.especialidad ?? "");
  const [cupo, setCupo] = useState(String(terapeuta.cupo_maximo));

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const c = Number(cupo);
    if (!(c >= 0)) {
      toast.error("Cupo inválido");
      return;
    }
    try {
      await actualizar.mutateAsync({
        id: terapeuta.id,
        especialidad: especialidad.trim() || null,
        cupo_maximo: c,
      });
      toast.success("Terapeuta actualizado");
      onCerrar();
    } catch {
      toast.error("No se pudo actualizar (requiere admin)");
    }
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo={terapeuta.full_name}>
      <form onSubmit={guardar} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="especialidad">Especialidad</Label>
          <Input
            id="especialidad"
            value={especialidad}
            onChange={(e) => setEspecialidad(e.target.value)}
            placeholder="Ej. Psicopedagogía, Lenguaje…"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cupo">Cupo máximo de pacientes</Label>
          <Input
            id="cupo"
            type="number"
            min="0"
            value={cupo}
            onChange={(e) => setCupo(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={actualizar.isPending}>
            {actualizar.isPending ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ReasignacionSection({ terapeutas }: { terapeutas: Terapeuta[] }) {
  const { data: pacientes = [], isLoading } = usePacientesAsignacion();
  const reasignar = useReasignarPaciente();
  const confirmar = useConfirm();
  const [busqueda, setBusqueda] = useState("");

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return pacientes.filter((p) =>
      q
        ? p.nombre.toLowerCase().includes(q) ||
          p.expediente.toLowerCase().includes(q)
        : true,
    );
  }, [pacientes, busqueda]);

  async function cambiar(pacienteId: string, psicologoId: string) {
    if (psicologoId) {
      const t = terapeutas.find((x) => x.id === psicologoId);
      if (t && t.cupo_maximo > 0 && t.pacientes_activos >= t.cupo_maximo) {
        const ok = await confirmar({
          titulo: "Terapeuta al límite de cupo",
          mensaje: `${t.full_name} ya tiene ${t.pacientes_activos} de ${t.cupo_maximo} pacientes activos. ¿Asignar de todas formas?`,
          confirmar: "Asignar de todas formas",
          peligro: true,
        });
        if (!ok) return;
      }
    }
    await reasignar.mutateAsync({
      pacienteId,
      psicologoId: psicologoId || null,
    });
    toast.success("Paciente reasignado");
  }

  return (
    <div className="space-y-3">
      <h2 className="font-fredoka text-xl text-luda-gris">
        Asignación de pacientes
      </h2>
      <div className="relative sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-luda-gris-light" />
        <Input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar paciente…"
          className="h-9 pl-9 text-xs"
        />
      </div>

      {isLoading && <p className="text-sm text-luda-gris-light">Cargando…</p>}

      <div className="space-y-2">
        {visibles.map((p) => (
          <LudaCard key={p.id} className="flex flex-wrap items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-luda-gris">
                {p.nombre}
              </p>
              <p className="text-xs text-luda-gris-light">{p.expediente}</p>
            </div>
            <Select
              value={p.psicologo_asignado_id ?? ""}
              onChange={(e) => cambiar(p.id, e.target.value)}
              className="h-9 w-auto min-w-[180px] text-xs"
            >
              <option value="">Sin asignar</option>
              {terapeutas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name} ({t.pacientes_activos}/{t.cupo_maximo})
                </option>
              ))}
            </Select>
          </LudaCard>
        ))}
        {!isLoading && visibles.length === 0 && (
          <LudaCard className="p-6">
            <p className="text-sm text-luda-gris-light">Sin pacientes.</p>
          </LudaCard>
        )}
      </div>
    </div>
  );
}
