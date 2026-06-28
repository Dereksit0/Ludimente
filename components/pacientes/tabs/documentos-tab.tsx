"use client";

import { useRef, useState } from "react";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Eye, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Campo } from "@/components/pacientes/form-nuevo-paciente/campo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LudaCard } from "@/components/ui/luda-card";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import {
  abrirDocumento,
  useDocumentosPaciente,
  useEliminarDocumento,
  useSubirDocumento,
  type Documento,
} from "@/hooks/use-documentos";
import type { PacienteDetalle } from "@/hooks/use-pacientes";
import { TIPO_DOCUMENTO_LABEL, TIPO_DOCUMENTO_OPCIONES } from "@/lib/catalogos";
import type { TipoDocumento } from "@/types/database.types";

/** Formatea bytes a una unidad legible. */
function tamanioLegible(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SubirForm({
  guardando,
  onGuardar,
}: {
  guardando: boolean;
  onGuardar: (v: {
    archivo: File;
    nombre_display: string;
    tipo: TipoDocumento;
    visible_portal_padres: boolean;
  }) => void;
}) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoDocumento>("otro");
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!archivo) {
      toast.error("Selecciona un archivo");
      return;
    }
    onGuardar({
      archivo,
      nombre_display: nombre.trim() || archivo.name,
      tipo,
      visible_portal_padres: visible,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Campo label="Archivo" requerido>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center gap-3 rounded-xl border border-dashed border-luda-lila/40 bg-luda-lila-light/40 px-4 py-6 text-left transition-colors hover:border-luda-lila"
        >
          <Upload className="h-5 w-5 text-luda-lila-dark" />
          <span className="min-w-0 flex-1 truncate text-sm text-luda-gris">
            {archivo ? archivo.name : "Haz clic para elegir un archivo…"}
          </span>
          {archivo && (
            <span className="text-xs text-luda-gris-light">
              {tamanioLegible(archivo.size)}
            </span>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.xls,.xlsx"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setArchivo(f);
            if (f && !nombre) setNombre(f.name.replace(/\.[^.]+$/, ""));
          }}
        />
      </Campo>

      <Campo label="Nombre visible">
        <Input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej. Reporte WISC-V — junio 2026"
        />
      </Campo>

      <Campo label="Tipo de documento">
        <Select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoDocumento)}
        >
          {TIPO_DOCUMENTO_OPCIONES.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </Select>
      </Campo>

      <label className="flex items-center gap-2 text-sm font-semibold text-luda-gris">
        <input
          type="checkbox"
          className="h-4 w-4 accent-luda-lila"
          checked={visible}
          onChange={(e) => setVisible(e.target.checked)}
        />
        Visible en el portal de padres
      </label>

      <Button type="submit" className="w-full" disabled={guardando}>
        {guardando ? (
          <>
            <Loader2 className="animate-spin" /> Subiendo…
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" /> Subir documento
          </>
        )}
      </Button>
    </form>
  );
}

export function DocumentosTab({ paciente }: { paciente: PacienteDetalle }) {
  const { data: documentos = [], isLoading } = useDocumentosPaciente(paciente.id);
  const subir = useSubirDocumento(paciente.id);
  const eliminar = useEliminarDocumento(paciente.id);
  const [abierto, setAbierto] = useState(false);
  const [abriendo, setAbriendo] = useState<string | null>(null);

  async function guardar(v: {
    archivo: File;
    nombre_display: string;
    tipo: TipoDocumento;
    visible_portal_padres: boolean;
  }) {
    try {
      await subir.mutateAsync(v);
      toast.success("Documento subido");
      setAbierto(false);
    } catch {
      toast.error("No se pudo subir el documento");
    }
  }

  async function ver(doc: Documento) {
    setAbriendo(doc.id);
    const url = await abrirDocumento(doc);
    setAbriendo(null);
    if (url) window.open(url, "_blank", "noopener");
    else toast.error("No se pudo abrir el documento");
  }

  async function borrar(doc: Documento) {
    if (!window.confirm(`¿Eliminar "${doc.nombre_display}"?`)) return;
    try {
      await eliminar.mutateAsync(doc);
      toast.success("Documento eliminado");
    } catch {
      toast.error("No se pudo eliminar");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-luda-gris">Documentos del expediente</h3>
        <Button size="sm" onClick={() => setAbierto(true)}>
          <Upload className="h-4 w-4" /> Subir documento
        </Button>
      </div>

      {isLoading && <p className="text-sm text-luda-gris-light">Cargando…</p>}
      {!isLoading && documentos.length === 0 && (
        <LudaCard className="flex flex-col items-center gap-2 p-8 text-center">
          <FileText className="h-8 w-8 text-luda-lila/50" />
          <p className="text-sm text-luda-gris-light">
            Aún no hay documentos. Sube reportes, consentimientos o estudios del
            paciente.
          </p>
        </LudaCard>
      )}

      <div className="space-y-2">
        {documentos.map((doc) => (
          <LudaCard key={doc.id} className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-luda-lila-light text-luda-lila-dark">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-luda-gris">
                <span className="truncate">{doc.nombre_display}</span>
                {doc.visible_portal_padres && (
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                    Portal padres
                  </span>
                )}
              </p>
              <p className="text-xs text-luda-gris-light">
                {TIPO_DOCUMENTO_LABEL[doc.tipo] ?? doc.tipo} ·{" "}
                {tamanioLegible(doc.tamanio_bytes)} ·{" "}
                {format(new Date(doc.created_at), "d 'de' MMM yyyy", {
                  locale: es,
                })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => ver(doc)}
              aria-label="Ver documento"
              disabled={abriendo === doc.id}
              className="rounded-lg p-2 text-luda-gris-light hover:bg-luda-lila-light hover:text-luda-lila-dark disabled:opacity-50"
            >
              {abriendo === doc.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => borrar(doc)}
              aria-label="Eliminar documento"
              className="rounded-lg p-2 text-luda-gris-light hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </LudaCard>
        ))}
      </div>

      <Modal
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo="Subir documento"
      >
        <SubirForm guardando={subir.isPending} onGuardar={guardar} />
      </Modal>
    </div>
  );
}
