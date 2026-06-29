"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Loader2, Search, UserRound, type LucideIcon } from "lucide-react";

import { LudaBadge } from "@/components/ui/luda-badge";
import { Modal } from "@/components/ui/modal";
import { useBuscarPacientes } from "@/hooks/use-buscar-pacientes";
import type { Rol } from "@/types/database.types";

import { navParaRol, type NavItem } from "./nav-config";

/** Quita acentos y pasa a minúsculas para comparar sin distinción. */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

type Sugerencia =
  | { tipo: "nav"; href: string; label: string; icon: LucideIcon }
  | { tipo: "paciente"; id: string; render: React.ReactNode };

export function BuscadorGlobal({ rol }: { rol: Rol }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [debounced, setDebounced] = useState("");
  const [activo, setActivo] = useState(0);

  const navItems = useMemo(() => navParaRol(rol), [rol]);

  // Debounce de la búsqueda de pacientes (consulta a la BD).
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

  const { data: pacientes = [], isFetching } = useBuscarPacientes(debounced);

  // Módulos/acciones que coinciden con lo escrito (búsqueda instantánea local).
  const navMatches = useMemo<NavItem[]>(() => {
    const q = normalizar(texto.trim());
    if (!q) return navItems; // sin texto → accesos rápidos
    return navItems.filter((item) => {
      const heno = [item.label, ...(item.keywords ?? [])].map(normalizar);
      return heno.some((h) => h.includes(q));
    });
  }, [navItems, texto]);

  // Lista combinada para navegación con teclado (módulos primero, luego pacientes).
  const sugerencias = useMemo<Sugerencia[]>(() => {
    const navs: Sugerencia[] = navMatches.map((i) => ({
      tipo: "nav",
      href: i.href,
      label: i.label,
      icon: i.icon,
    }));
    const pacs: Sugerencia[] = pacientes.map((p) => ({
      tipo: "paciente",
      id: p.id,
      render: (
        <>
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
        </>
      ),
    }));
    return [...navs, ...pacs];
  }, [navMatches, pacientes]);

  // Reinicia la selección cuando cambian los resultados.
  useEffect(() => {
    setActivo(0);
  }, [texto, pacientes.length]);

  function cerrar() {
    setAbierto(false);
    setTexto("");
    setDebounced("");
  }

  function elegir(s: Sugerencia) {
    cerrar();
    router.push(s.tipo === "nav" ? s.href : `/pacientes/${s.id}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActivo((i) => Math.min(i + 1, sugerencias.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActivo((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && sugerencias[activo]) {
      e.preventDefault();
      elegir(sugerencias[activo]);
    }
  }

  const hayTexto = texto.trim().length > 0;
  const sinPacientes =
    debounced.length >= 2 && pacientes.length === 0 && !isFetching;

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

      <Modal abierto={abierto} onCerrar={cerrar} titulo="Buscar" className="max-w-xl">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-luda-gris-light" />
          <input
            autoFocus
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Paciente, expediente o módulo (cobranza, agenda…)"
            className="w-full rounded-xl border border-luda-lila/30 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-luda-lila focus:ring-2 focus:ring-luda-lila/30"
          />
          {isFetching && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-luda-gris-light" />
          )}
        </div>

        <div className="mt-3 space-y-3">
          {/* Módulos / accesos rápidos */}
          {navMatches.length > 0 && (
            <div className="space-y-1">
              <p className="px-2 text-[11px] font-bold uppercase tracking-wide text-luda-gris-light">
                {hayTexto ? "Ir a" : "Accesos rápidos"}
              </p>
              {sugerencias.map((s, i) =>
                s.tipo === "nav" ? (
                  <button
                    key={`nav-${s.href}`}
                    type="button"
                    onMouseEnter={() => setActivo(i)}
                    onClick={() => elegir(s)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      i === activo ? "bg-luda-lila-light" : "hover:bg-luda-fondo"
                    }`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-luda-lila-light text-luda-lila-dark">
                      <s.icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-bold text-luda-gris">
                      {s.label}
                    </span>
                  </button>
                ) : null,
              )}
            </div>
          )}

          {/* Pacientes */}
          {pacientes.length > 0 && (
            <div className="space-y-1">
              <p className="px-2 text-[11px] font-bold uppercase tracking-wide text-luda-gris-light">
                Pacientes
              </p>
              {sugerencias.map((s, i) =>
                s.tipo === "paciente" ? (
                  <button
                    key={`pac-${s.id}`}
                    type="button"
                    onMouseEnter={() => setActivo(i)}
                    onClick={() => elegir(s)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      i === activo ? "bg-luda-lila-light" : "hover:bg-luda-fondo"
                    }`}
                  >
                    {s.render}
                  </button>
                ) : null,
              )}
            </div>
          )}

          {/* Estados vacíos */}
          {sinPacientes && navMatches.length === 0 && (
            <p className="px-2 py-6 text-center text-sm text-luda-gris-light">
              Sin resultados para “{debounced}”.
            </p>
          )}
          {sinPacientes && navMatches.length > 0 && (
            <p className="px-2 pb-2 text-center text-xs text-luda-gris-light">
              No se encontraron pacientes para “{debounced}”.
            </p>
          )}
          {hayTexto && debounced.length < 2 && navMatches.length === 0 && (
            <p className="px-2 py-6 text-center text-sm text-luda-gris-light">
              Escribe al menos 2 letras para buscar pacientes.
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}
