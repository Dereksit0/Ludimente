"use client";

import { useMemo, useRef, useState } from "react";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FileSignature, Pen, Plus, Printer, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LudaCard } from "@/components/ui/luda-card";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useConfiguracion } from "@/hooks/use-configuracion";
import {
  useConsentimientos,
  useCrearConsentimiento,
  useEliminarConsentimiento,
  useFirmarConsentimiento,
  type ConsentimientoListItem,
} from "@/hooks/use-consentimientos";
import { usePacientes } from "@/hooks/use-pacientes";
import {
  PARENTESCOS,
  PLANTILLA_CONSENTIMIENTO,
  TIPO_CONSENTIMIENTO_LABEL,
  TIPO_CONSENTIMIENTO_OPCIONES,
} from "@/lib/catalogos";
import { imprimirConsentimiento } from "@/lib/print-consentimiento";
import { consentimientoSchema, primerError } from "@/lib/validations/modulos.schema";

import { FirmaCanvas, type FirmaCanvasHandle } from "./firma-canvas";

export function ConsentimientosCliente() {
  const { data: lista = [], isLoading } = useConsentimientos();
  const { data: config } = useConfiguracion();
  const eliminar = useEliminarConsentimiento();
  const confirmar = useConfirm();
  const [busqueda, setBusqueda] = useState("");
  const [crear, setCrear] = useState(false);
  const [firmar, setFirmar] = useState<ConsentimientoListItem | null>(null);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return lista.filter((c) =>
      q
        ? c.paciente_nombre.toLowerCase().includes(q) ||
          c.titulo.toLowerCase().includes(q) ||
          c.expediente.toLowerCase().includes(q)
        : true,
    );
  }, [lista, busqueda]);

  async function borrar(id: string) {
    const ok = await confirmar({
      titulo: "Eliminar consentimiento",
      mensaje: "¿Eliminar este documento? Esta acción no se puede deshacer.",
      confirmar: "Eliminar",
      peligro: true,
    });
    if (!ok) return;
    await eliminar.mutateAsync(id);
    toast.success("Consentimiento eliminado");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-fredoka text-3xl text-luda-gris">Consentimientos</h1>
          <p className="mt-1 text-sm text-luda-gris-light">
            Documentos y firmas de los tutores.
          </p>
        </div>
        <Button onClick={() => setCrear(true)}>
          <Plus /> Nuevo consentimiento
        </Button>
      </div>

      <div className="relative sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-luda-gris-light" />
        <Input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar paciente o documento…"
          className="h-9 pl-9 text-xs"
        />
      </div>

      {isLoading && <p className="text-sm text-luda-gris-light">Cargando…</p>}

      {!isLoading && visibles.length === 0 && (
        <LudaCard className="p-8 text-center">
          <FileSignature className="mx-auto h-10 w-10 text-luda-lila" />
          <p className="mt-3 font-semibold text-luda-gris">
            Aún no hay consentimientos
          </p>
          <p className="mt-1 text-sm text-luda-gris-light">
            Crea un documento y captura la firma del tutor.
          </p>
        </LudaCard>
      )}

      <div className="space-y-2">
        {visibles.map((c) => (
          <LudaCard key={c.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-luda-gris">
                {c.titulo}
              </p>
              <p className="text-xs text-luda-gris-light">
                {c.paciente_nombre} · {c.expediente} ·{" "}
                {TIPO_CONSENTIMIENTO_LABEL[c.tipo] ?? c.tipo}
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                c.firmado
                  ? "bg-green-50 text-green-700"
                  : "bg-yellow-50 text-yellow-700"
              }`}
            >
              {c.firmado
                ? `Firmado ${
                    c.firmado_at
                      ? format(new Date(c.firmado_at), "d MMM yyyy", {
                          locale: es,
                        })
                      : ""
                  }`
                : "Pendiente de firma"}
            </span>
            {!c.firmado && (
              <Button size="sm" variant="outline" onClick={() => setFirmar(c)}>
                <Pen className="h-4 w-4" /> Firmar
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => imprimirConsentimiento(c, config)}
            >
              <Printer className="h-4 w-4" /> Imprimir
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Eliminar"
              onClick={() => borrar(c.id)}
              className="h-9 w-9 text-luda-gris-light hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </LudaCard>
        ))}
      </div>

      {crear && <ModalNuevo onCerrar={() => setCrear(false)} />}
      {firmar && (
        <ModalFirmar
          consentimiento={firmar}
          onCerrar={() => setFirmar(null)}
        />
      )}
    </div>
  );
}

function ModalNuevo({ onCerrar }: { onCerrar: () => void }) {
  const { data: pacientes = [] } = usePacientes();
  const crear = useCrearConsentimiento();

  const [pacienteId, setPacienteId] = useState("");
  const [tipo, setTipo] = useState("consentimiento_informado");
  const [titulo, setTitulo] = useState(
    TIPO_CONSENTIMIENTO_LABEL["consentimiento_informado"],
  );
  const [contenido, setContenido] = useState(
    PLANTILLA_CONSENTIMIENTO["consentimiento_informado"],
  );

  function cambiarTipo(nuevo: string) {
    setTipo(nuevo);
    setTitulo(TIPO_CONSENTIMIENTO_LABEL[nuevo] ?? "");
    setContenido(PLANTILLA_CONSENTIMIENTO[nuevo] ?? "");
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const val = consentimientoSchema.safeParse({ paciente_id: pacienteId, titulo });
    if (!val.success) {
      toast.error(primerError(val.error));
      return;
    }
    try {
      await crear.mutateAsync({
        paciente_id: pacienteId,
        tipo,
        titulo: titulo.trim(),
        contenido: contenido.trim() || null,
      });
      toast.success("Consentimiento creado");
      onCerrar();
    } catch {
      toast.error("No se pudo crear (revisa permisos: admin o recepción)");
    }
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo="Nuevo consentimiento">
      <form onSubmit={guardar} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="paciente">Paciente</Label>
          <Select
            id="paciente"
            value={pacienteId}
            onChange={(e) => setPacienteId(e.target.value)}
            required
          >
            <option value="" disabled>
              Selecciona…
            </option>
            {pacientes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} {p.apellido_paterno} {p.apellido_materno ?? ""} ·{" "}
                {p.numero_expediente}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tipo">Tipo</Label>
          <Select
            id="tipo"
            value={tipo}
            onChange={(e) => cambiarTipo(e.target.value)}
          >
            {TIPO_CONSENTIMIENTO_OPCIONES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="titulo">Título</Label>
          <Input
            id="titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="contenido">Texto del documento</Label>
          <Textarea
            id="contenido"
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            className="min-h-[140px]"
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={crear.isPending}>
            {crear.isPending ? "Guardando…" : "Crear"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ModalFirmar({
  consentimiento,
  onCerrar,
}: {
  consentimiento: ConsentimientoListItem;
  onCerrar: () => void;
}) {
  const firmar = useFirmarConsentimiento();
  const firmaRef = useRef<FirmaCanvasHandle>(null);
  const [nombre, setNombre] = useState(consentimiento.firmante_nombre ?? "");
  const [parentesco, setParentesco] = useState(
    consentimiento.firmante_parentesco ?? "Madre",
  );

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const firma = firmaRef.current?.obtener();
    if (!firma) {
      toast.error("Captura la firma del tutor");
      return;
    }
    if (!nombre.trim()) {
      toast.error("Escribe el nombre del firmante");
      return;
    }
    try {
      await firmar.mutateAsync({
        id: consentimiento.id,
        firma_data: firma,
        firmante_nombre: nombre.trim(),
        firmante_parentesco: parentesco,
      });
      toast.success("Consentimiento firmado");
      onCerrar();
    } catch {
      toast.error("No se pudo guardar la firma");
    }
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo="Firmar consentimiento">
      <form onSubmit={guardar} className="space-y-4">
        <p className="text-sm text-luda-gris-light">
          {consentimiento.titulo} · {consentimiento.paciente_nombre}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre del firmante</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="parentesco">Parentesco</Label>
            <Select
              id="parentesco"
              value={parentesco}
              onChange={(e) => setParentesco(e.target.value)}
            >
              {PARENTESCOS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Firma</Label>
          <FirmaCanvas ref={firmaRef} />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={firmar.isPending}>
            {firmar.isPending ? "Guardando…" : "Guardar firma"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
