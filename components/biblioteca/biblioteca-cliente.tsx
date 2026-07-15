"use client";

import { useMemo, useState } from "react";

import { BookOpen, ExternalLink, Plus, Search, Trash2 } from "lucide-react";
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
import { useDraftState } from "@/hooks/use-form-draft";
import {
  useActualizarRecurso,
  useCrearRecurso,
  useEliminarRecurso,
  useRecursos,
  type Recurso,
} from "@/hooks/use-recursos";
import {
  CATEGORIA_RECURSO_LABEL,
  CATEGORIA_RECURSO_OPCIONES,
} from "@/lib/catalogos";
import { BUCKET_RECURSOS, subirArchivo, urlPublica } from "@/lib/storage";
import { primerError, recursoSchema } from "@/lib/validations/modulos.schema";

function rangoEdad(min: number | null, max: number | null): string {
  if (min && max) return `${min}-${max} años`;
  if (min) return `Desde ${min} años`;
  if (max) return `Hasta ${max} años`;
  return "";
}

export function BibliotecaCliente() {
  const { data: recursos = [], isLoading } = useRecursos();
  const eliminar = useEliminarRecurso();
  const confirmar = useConfirm();
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("");
  const [crear, setCrear] = useState(false);
  const [editar, setEditar] = useState<Recurso | null>(null);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return recursos
      .filter((r) => (categoria ? r.categoria === categoria : true))
      .filter((r) =>
        q
          ? r.titulo.toLowerCase().includes(q) ||
            (r.descripcion ?? "").toLowerCase().includes(q) ||
            r.etiquetas.some((e) => e.toLowerCase().includes(q))
          : true,
      );
  }, [recursos, busqueda, categoria]);

  async function borrar(r: Recurso) {
    const ok = await confirmar({
      titulo: "Eliminar recurso",
      mensaje: "¿Eliminar este recurso? Esta acción no se puede deshacer.",
      confirmar: "Eliminar",
      peligro: true,
    });
    if (!ok) return;
    await eliminar.mutateAsync({ id: r.id, url: r.url });
    toast.success("Recurso eliminado");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-fredoka text-3xl text-luda-gris">Biblioteca</h1>
          <p className="mt-1 text-sm text-luda-gris-light">
            Recursos y actividades para sesiones y familias.
          </p>
        </div>
        <Button onClick={() => setCrear(true)}>
          <Plus /> Nuevo recurso
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-luda-gris-light" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por título o etiqueta…"
            className="h-9 pl-9 text-xs"
          />
        </div>
        <Select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="h-9 w-auto text-xs"
        >
          <option value="">Todas las categorías</option>
          {CATEGORIA_RECURSO_OPCIONES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>

      {isLoading && <p className="text-sm text-luda-gris-light">Cargando…</p>}

      {!isLoading && visibles.length === 0 && (
        <LudaCard className="p-8 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-luda-lila" />
          <p className="mt-3 font-semibold text-luda-gris">Biblioteca vacía</p>
          <p className="mt-1 text-sm text-luda-gris-light">
            Agrega actividades, lecturas o enlaces útiles.
          </p>
        </LudaCard>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibles.map((r) => (
          <LudaCard key={r.id} className="flex h-full flex-col p-5">
            <div className="flex items-start justify-between gap-2">
              <button
                type="button"
                onClick={() => setEditar(r)}
                className="min-w-0 flex-1 text-left"
              >
                <span className="inline-block rounded-full bg-luda-lila-light px-2 py-0.5 text-[11px] font-semibold text-luda-lila-dark">
                  {CATEGORIA_RECURSO_LABEL[r.categoria] ?? r.categoria}
                </span>
                <h3 className="mt-2 font-bold text-luda-gris">{r.titulo}</h3>
              </button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Eliminar"
                onClick={() => borrar(r)}
                className="h-8 w-8 shrink-0 text-luda-gris-light hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {r.descripcion && (
              <p className="mt-2 line-clamp-3 text-sm text-luda-gris-light">
                {r.descripcion}
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-1.5">
              {rangoEdad(r.edad_min, r.edad_max) && (
                <span className="rounded-full bg-luda-azul-light px-2 py-0.5 text-[11px] font-semibold text-luda-azul">
                  {rangoEdad(r.edad_min, r.edad_max)}
                </span>
              )}
              {r.etiquetas.map((e) => (
                <span
                  key={e}
                  className="rounded-full bg-luda-fondo px-2 py-0.5 text-[11px] font-semibold text-luda-gris-light"
                >
                  #{e}
                </span>
              ))}
            </div>

            {r.url && (
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto inline-flex items-center gap-1.5 pt-3 text-sm font-semibold text-luda-lila-dark hover:underline"
              >
                <ExternalLink className="h-4 w-4" /> Abrir recurso
              </a>
            )}
          </LudaCard>
        ))}
      </div>

      {(crear || editar) && (
        <ModalRecurso
          recurso={editar}
          onCerrar={() => {
            setCrear(false);
            setEditar(null);
          }}
        />
      )}
    </div>
  );
}

function ModalRecurso({
  recurso,
  onCerrar,
}: {
  recurso: Recurso | null;
  onCerrar: () => void;
}) {
  const crear = useCrearRecurso();
  const actualizar = useActualizarRecurso();
  const editando = Boolean(recurso);

  const [titulo, setTitulo] = useState(recurso?.titulo ?? "");
  const [categoria, setCategoria] = useState(recurso?.categoria ?? "actividad");
  const [descripcion, setDescripcion] = useState(recurso?.descripcion ?? "");
  const [url, setUrl] = useState(recurso?.url ?? "");
  const [etiquetas, setEtiquetas] = useState(
    (recurso?.etiquetas ?? []).join(", "),
  );
  const [edadMin, setEdadMin] = useState(
    recurso?.edad_min != null ? String(recurso.edad_min) : "",
  );
  const [edadMax, setEdadMax] = useState(
    recurso?.edad_max != null ? String(recurso.edad_max) : "",
  );
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);

  const { limpiar } = useDraftState({
    clave: `draft:recurso:${recurso?.id ?? "nuevo"}`,
    activo: true,
    valores: { titulo, categoria, descripcion, url, etiquetas, edadMin, edadMax },
    onRestaurar: (b) => {
      setTitulo(b.titulo);
      setCategoria(b.categoria);
      setDescripcion(b.descripcion);
      setUrl(b.url);
      setEtiquetas(b.etiquetas);
      setEdadMin(b.edadMin);
      setEdadMax(b.edadMax);
    },
  });

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const val = recursoSchema.safeParse({
      titulo,
      edad_min: edadMin ? Number(edadMin) : null,
      edad_max: edadMax ? Number(edadMax) : null,
    });
    if (!val.success) {
      toast.error(primerError(val.error));
      return;
    }
    if (!url.trim() && !archivo && !recurso?.url) {
      toast.error("Agrega un enlace o sube un archivo para este recurso.");
      return;
    }
    let urlFinal = url.trim() || null;
    if (archivo) {
      try {
        setSubiendo(true);
        const path = `${crypto.randomUUID()}-${archivo.name.replace(/\s+/g, "_")}`;
        await subirArchivo(BUCKET_RECURSOS, path, archivo);
        urlFinal = urlPublica(BUCKET_RECURSOS, path);
      } catch {
        setSubiendo(false);
        toast.error("No se pudo subir el archivo");
        return;
      }
      setSubiendo(false);
    }
    const datos = {
      titulo: titulo.trim(),
      categoria,
      descripcion: descripcion.trim() || null,
      url: urlFinal,
      etiquetas: etiquetas
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      edad_min: edadMin ? Number(edadMin) : null,
      edad_max: edadMax ? Number(edadMax) : null,
    };
    try {
      if (recurso) {
        await actualizar.mutateAsync({
          id: recurso.id,
          cambios: datos,
          urlAnterior: recurso.url,
        });
        toast.success("Recurso actualizado");
      } else {
        await crear.mutateAsync(datos);
        toast.success("Recurso agregado");
      }
      limpiar();
      onCerrar();
    } catch {
      toast.error("No se pudo guardar");
    }
  }

  const pendiente = crear.isPending || actualizar.isPending;

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo={editando ? "Editar recurso" : "Nuevo recurso"}
    >
      <form onSubmit={guardar} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="titulo">Título</Label>
          <Input
            id="titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej. Fichas de conciencia fonológica"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="categoria">Categoría</Label>
          <Select
            id="categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            {CATEGORIA_RECURSO_OPCIONES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="descripcion">Descripción</Label>
          <Textarea
            id="descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
          <RedactarBoton
            valor={descripcion}
            contexto="Descripción de un recurso de biblioteca para terapia infantil"
            onRedactado={setDescripcion}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="url">Enlace (opcional)</Label>
          <Input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="archivo">O sube un archivo (opcional)</Label>
          <Input
            id="archivo"
            type="file"
            onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
            className="text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-luda-lila-light file:px-3 file:py-1 file:text-luda-lila-dark"
          />
          {archivo && (
            <p className="text-xs text-luda-gris-light">
              Se subirá: {archivo.name}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="edadMin">Edad mínima</Label>
            <Input
              id="edadMin"
              type="number"
              min="0"
              value={edadMin}
              onChange={(e) => setEdadMin(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edadMax">Edad máxima</Label>
            <Input
              id="edadMax"
              type="number"
              min="0"
              value={edadMax}
              onChange={(e) => setEdadMax(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="etiquetas">Etiquetas (separadas por coma)</Label>
          <Input
            id="etiquetas"
            value={etiquetas}
            onChange={(e) => setEtiquetas(e.target.value)}
            placeholder="lectura, atención, motricidad"
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pendiente || subiendo}>
            {subiendo
              ? "Subiendo…"
              : pendiente
                ? "Guardando…"
                : editando
                  ? "Guardar"
                  : "Agregar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
