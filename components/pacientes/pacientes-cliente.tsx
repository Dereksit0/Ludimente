"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import Fuse from "fuse.js";
import { LayoutGrid, List, Plus, Search } from "lucide-react";

import { PacienteCard } from "@/components/pacientes/paciente-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LudaBadge } from "@/components/ui/luda-badge";
import { Select } from "@/components/ui/select";
import { usePacientes, type PacienteListItem } from "@/hooks/use-pacientes";
import { usePsicologos } from "@/hooks/use-perfiles";
import { edadLegible } from "@/lib/fechas";
import { ESTATUS_PACIENTE_OPCIONES } from "@/lib/catalogos";
import { LudiMascota } from "@/components/ui/ludi-mascota";

type Vista = "tarjeta" | "lista";

export function PacientesCliente() {
  const { data: pacientes, isLoading, isError } = usePacientes();
  const { data: psicologos } = usePsicologos();

  const [busqueda, setBusqueda] = useState("");
  const [estatus, setEstatus] = useState("");
  const [psicologoId, setPsicologoId] = useState("");
  const [vista, setVista] = useState<Vista>("tarjeta");

  const fuse = useMemo(
    () =>
      new Fuse(pacientes ?? [], {
        keys: [
          "nombre",
          "apellido_paterno",
          "apellido_materno",
          "numero_expediente",
          "diagnostico_principal",
        ],
        threshold: 0.3,
        ignoreLocation: true,
      }),
    [pacientes],
  );

  const filtrados = useMemo(() => {
    let lista: PacienteListItem[] = pacientes ?? [];
    if (busqueda.trim()) {
      lista = fuse.search(busqueda.trim()).map((r) => r.item);
    }
    if (estatus) lista = lista.filter((p) => p.estatus === estatus);
    if (psicologoId) {
      lista = lista.filter((p) => p.psicologo_asignado_id === psicologoId);
    }
    return lista;
  }, [pacientes, fuse, busqueda, estatus, psicologoId]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-fredoka text-3xl text-luda-gris">Pacientes 🐙</h1>
          <p className="mt-1 text-sm text-luda-gris-light">
            {pacientes ? `${pacientes.length} en total` : "Cargando…"}
          </p>
        </div>
        <Button asChild>
          <Link href="/pacientes/nuevo">
            <Plus /> Nuevo paciente
          </Link>
        </Button>
      </div>

      {/* Controles */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-luda-gris-light" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, expediente o diagnóstico…"
            className="pl-10"
          />
        </div>

        <Select
          value={estatus}
          onChange={(e) => setEstatus(e.target.value)}
          className="w-auto min-w-[160px]"
        >
          <option value="">Todos los estatus</option>
          {ESTATUS_PACIENTE_OPCIONES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>

        <Select
          value={psicologoId}
          onChange={(e) => setPsicologoId(e.target.value)}
          className="w-auto min-w-[180px]"
        >
          <option value="">Todos los psicólogos</option>
          {(psicologos ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
            </option>
          ))}
        </Select>

        <div className="flex overflow-hidden rounded-xl border border-luda-lila/30">
          <button
            type="button"
            onClick={() => setVista("tarjeta")}
            aria-label="Vista de tarjetas"
            className={vista === "tarjeta" ? activo : inactivo}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setVista("lista")}
            aria-label="Vista de lista"
            className={vista === "lista" ? activo : inactivo}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Estados */}
      {isLoading && <SkeletonGrid />}
      {isError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          No pudimos cargar los pacientes. Revisa tu conexión e inténtalo de nuevo.
        </p>
      )}
      {!isLoading && !isError && filtrados.length === 0 && <Vacio />}

      {!isLoading && !isError && filtrados.length > 0 && (
        <>
          {vista === "tarjeta" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtrados.map((p) => (
                <PacienteCard key={p.id} paciente={p} />
              ))}
            </div>
          ) : (
            <TablaPacientes pacientes={filtrados} />
          )}
        </>
      )}
    </div>
  );
}

const activo = "flex items-center justify-center bg-luda-lila px-3 py-2 text-white";
const inactivo =
  "flex items-center justify-center bg-white px-3 py-2 text-luda-gris-light hover:bg-luda-lila-light";

function TablaPacientes({ pacientes }: { pacientes: PacienteListItem[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-luda-lila/15 bg-white shadow-luda">
      <table className="w-full text-left text-sm">
        <thead className="bg-luda-lila-light/50 text-luda-gris-light">
          <tr>
            <th className="px-4 py-3 font-semibold">Expediente</th>
            <th className="px-4 py-3 font-semibold">Nombre</th>
            <th className="px-4 py-3 font-semibold">Edad</th>
            <th className="px-4 py-3 font-semibold">Estatus</th>
          </tr>
        </thead>
        <tbody>
          {pacientes.map((p) => (
            <tr
              key={p.id}
              className="border-t border-luda-lila/10 hover:bg-luda-lila-light/30"
            >
              <td className="px-4 py-3 font-mono text-xs">
                {p.numero_expediente}
              </td>
              <td className="px-4 py-3 font-semibold text-luda-gris">
                <Link
                  href={`/pacientes/${p.id}`}
                  className="hover:text-luda-lila-dark hover:underline"
                >
                  {p.nombre} {p.apellido_paterno} {p.apellido_materno ?? ""}
                </Link>
              </td>
              <td className="px-4 py-3 text-luda-gris-light">
                {edadLegible(p.fecha_nacimiento)}
              </td>
              <td className="px-4 py-3">
                <LudaBadge tipo="paciente" status={p.estatus} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton-luda h-36" />
      ))}
    </div>
  );
}

function Vacio() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-28 opacity-90">
        <LudiMascota />
      </div>
      <p className="mt-4 font-semibold text-luda-gris">
        No encontramos pacientes con esos criterios
      </p>
      <p className="mt-1 text-sm text-luda-gris-light">
        Prueba con otra búsqueda o registra un nuevo paciente. 🐙
      </p>
    </div>
  );
}
