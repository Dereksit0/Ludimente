"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Loader2, Search, UserRound } from "lucide-react";

import { LudaBadge } from "@/components/ui/luda-badge";
import { Modal } from "@/components/ui/modal";
import { useBuscarPacientes } from "@/hooks/use-buscar-pacientes";

export function BuscadorGlobal() {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [debounced, setDebounced] = useState("");
  const [activo, setActivo] = useState(0);

  // Debounce de la búsqueda.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(texto), 250);
    return () => clearTimeout(t);
  }, [texto]);

  // Atajo ⌘K / Ctrl+K global.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAbierto(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const { data: resultados = [], isFetching } = useBuscarPacientes(debounced);

  useEffect(() => {
    setActivo(0);
  }, [debounced]);

  function cerrar() {
    setAbierto(false);
    setTexto("");
    setDebounced("");
  }

  function ir(id: string) {
    cerrar();
    router.push(`/pacientes/${id}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActivo((i) => Math.min(i + 1, resultados.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActivo((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && resultados[activo]) {
      e.preventDefault();
      ir(resultados[activo].id);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="flex items-center gap-2 rounded-xl border border-luda-lila/30 bg-white px-3 py-2 text-sm text-luda-gris-light transition-colors hover:border-luda-lila"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Buscar…</span>
        <kbd className="ml-2 hidden rounded border border-luda-lila/30 px-1.5 text-xs sm:inline">
          ⌘K
        </kbd>
      </button>

      <Modal abierto={abierto} onCerrar={cerrar} titulo="Buscar paciente" className="max-w-xl">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-luda-gris-light" />
          <input
            autoFocus
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Nombre o número de expediente…"
            className="w-full rounded-xl border border-luda-lila/30 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-luda-lila focus:ring-2 focus:ring-luda-lila/30"
          />
          {isFetching && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-luda-gris-light" />
          )}
        </div>

        <div className="mt-3 space-y-1">
          {debounced.length >= 2 && resultados.length === 0 && !isFetching && (
            <p className="px-2 py-6 text-center text-sm text-luda-gris-light">
              Sin resultados para “{debounced}”.
            </p>
          )}
          {debounced.length < 2 && (
            <p className="px-2 py-6 text-center text-sm text-luda-gris-light">
              Escribe al menos 2 letras para buscar.
            </p>
          )}
          {resultados.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onMouseEnter={() => setActivo(i)}
              onClick={() => ir(p.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                i === activo ? "bg-luda-lila-light" : "hover:bg-luda-fondo"
              }`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-luda-lila-light text-luda-lila-dark">
                <UserRound className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-luda-gris">
                  {p.nombre} {p.apellido_paterno} {p.apellido_materno ?? ""}
                </span>
                <span className="block truncate font-mono text-xs text-luda-gris-light">
                  {p.numero_expediente}
                </span>
              </span>
              <LudaBadge tipo="paciente" status={p.estatus} />
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}
