"use client";

import { useMemo, useState } from "react";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FileText, PencilLine, Printer, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LudaCard } from "@/components/ui/luda-card";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { SugerenciaPlanBoton } from "@/components/planes/sugerencia-plan-boton";
import { useConfiguracion } from "@/hooks/use-configuracion";
import { useDraftState } from "@/hooks/use-form-draft";
import {
  useFormatosLlenados,
  useGuardarFormatoLlenado,
  useEliminarFormatoLlenado,
  type FormatoLlenadoItem,
} from "@/hooks/use-formatos-llenados";
import { usePacientes } from "@/hooks/use-pacientes";
import { FORMATOS, type Formato } from "@/lib/formatos/plantillas-formato";
import {
  imprimirFormato,
  respuestasATexto,
  type RespuestasFormato,
} from "@/lib/print-formato";

import { FormatoFiller } from "./formato-filler";

const CATEGORIA_ORDEN: Formato["categoria"][] = [
  "Entrevista",
  "Sensorial",
  "Evaluación",
  "Instrumento",
];

const CATEGORIA_LABEL: Record<Formato["categoria"], string> = {
  Entrevista: "Entrevistas",
  Sensorial: "Perfil sensorial",
  Evaluación: "Evaluaciones",
  Instrumento: "Hojas de registro por instrumento",
};

const formatoPorId = (id: string) => FORMATOS.find((f) => f.id === id);

export function FormatosCliente() {
  const { data: config } = useConfiguracion();
  const { data: guardados = [] } = useFormatosLlenados();
  const eliminarLlenado = useEliminarFormatoLlenado();
  const confirmar = useConfirm();
  const [busqueda, setBusqueda] = useState("");
  const [llenar, setLlenar] = useState<{
    formato: Formato;
    inicial?: FormatoLlenadoItem;
  } | null>(null);

  const grupos = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const visibles = q
      ? FORMATOS.filter(
          (f) =>
            f.titulo.toLowerCase().includes(q) ||
            f.descripcion.toLowerCase().includes(q),
        )
      : FORMATOS;
    return CATEGORIA_ORDEN.map((cat) => ({
      cat,
      items: visibles.filter((f) => f.categoria === cat),
    })).filter((g) => g.items.length > 0);
  }, [busqueda]);

  function imprimirGuardado(item: FormatoLlenadoItem) {
    const f = formatoPorId(item.formato_id);
    if (!f) {
      toast.error("No se encontró la plantilla de este formato");
      return;
    }
    imprimirFormato(f, config, item.respuestasMap, item.paciente_nombre);
  }

  function editarGuardado(item: FormatoLlenadoItem) {
    const f = formatoPorId(item.formato_id);
    if (!f) {
      toast.error("No se encontró la plantilla de este formato");
      return;
    }
    setLlenar({ formato: f, inicial: item });
  }

  async function borrarGuardado(item: FormatoLlenadoItem) {
    const ok = await confirmar({
      titulo: "Eliminar formato",
      mensaje: `¿Eliminar el formato “${item.titulo}” de ${item.paciente_nombre}?`,
      confirmar: "Eliminar",
      peligro: true,
    });
    if (!ok) return;
    await eliminarLlenado.mutateAsync(item.id);
    toast.success("Formato eliminado");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-fredoka text-3xl text-luda-gris">Formatos</h1>
        <p className="mt-1 text-sm text-luda-gris-light">
          Llénalos en el sistema y guárdalos por paciente, o imprímelos en
          blanco. Todos salen con el membrete de Ludimente.
        </p>
      </div>

      {/* Formatos guardados */}
      {guardados.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-luda-gris-light">
            Formatos guardados ({guardados.length})
          </h2>
          <div className="space-y-2">
            {guardados.map((g) => (
              <LudaCard key={g.id} className="flex flex-wrap items-center gap-3 p-4">
                <FileText className="h-5 w-5 shrink-0 text-luda-lila-dark" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-luda-gris">
                    {g.titulo}
                  </p>
                  <p className="text-xs text-luda-gris-light">
                    {g.paciente_nombre} · {g.expediente} ·{" "}
                    {format(new Date(g.created_at), "d MMM yyyy", { locale: es })}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => imprimirGuardado(g)}
                >
                  <Printer className="h-4 w-4" /> Imprimir
                </Button>
                <button
                  onClick={() => editarGuardado(g)}
                  aria-label="Editar"
                  className="rounded-lg p-2 text-luda-gris-light hover:bg-luda-lila-light hover:text-luda-lila-dark"
                >
                  <PencilLine className="h-4 w-4" />
                </button>
                <button
                  onClick={() => borrarGuardado(g)}
                  aria-label="Eliminar"
                  className="rounded-lg p-2 text-luda-gris-light hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </LudaCard>
            ))}
          </div>
        </section>
      )}

      <div className="relative sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-luda-gris-light" />
        <Input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar formato…"
          className="h-9 pl-9 text-xs"
        />
      </div>

      {grupos.map((g) => (
        <section key={g.cat} className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-luda-gris-light">
            {CATEGORIA_LABEL[g.cat]}
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {g.items.map((f) => (
              <LudaCard key={f.id} className="flex flex-col gap-3 p-4">
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-5 w-5 shrink-0 text-luda-lila-dark" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-luda-gris">{f.titulo}</p>
                    <p className="mt-0.5 text-xs text-luda-gris-light">
                      {f.descripcion}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => setLlenar({ formato: f })}
                  >
                    <PencilLine className="h-4 w-4" /> Llenar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => imprimirFormato(f, config)}
                  >
                    <Printer className="h-4 w-4" /> En blanco
                  </Button>
                </div>
              </LudaCard>
            ))}
          </div>
        </section>
      ))}

      {llenar && (
        <ModalLlenar
          formato={llenar.formato}
          inicial={llenar.inicial}
          onCerrar={() => setLlenar(null)}
        />
      )}
    </div>
  );
}

function ModalLlenar({
  formato,
  inicial,
  onCerrar,
}: {
  formato: Formato;
  inicial?: FormatoLlenadoItem;
  onCerrar: () => void;
}) {
  const { data: pacientes = [] } = usePacientes();
  const { data: config } = useConfiguracion();
  const guardar = useGuardarFormatoLlenado();

  const [pacienteId, setPacienteId] = useState(inicial?.paciente_id ?? "");
  const [valores, setValores] = useState<RespuestasFormato>(
    inicial?.respuestasMap ?? {},
  );
  const [guardado, setGuardado] = useState(false);

  const esEntrevistaInicial =
    formato.id === "entrevista-inicial" || formato.id === "entrevista-adultos";
  const pacienteNombre = pacientes.find((p) => p.id === pacienteId);
  const nombreStr = pacienteNombre
    ? `${pacienteNombre.nombre} ${pacienteNombre.apellido_paterno}`
    : undefined;

  const { limpiar } = useDraftState({
    clave: `draft:formato:${formato.id}:${inicial?.id ?? "nuevo"}`,
    activo: true,
    valores: { pacienteId, valores },
    onRestaurar: (b) => {
      setPacienteId(b.pacienteId);
      setValores(b.valores);
    },
  });

  function set(key: string, valor: unknown) {
    setValores((prev) => ({ ...prev, [key]: valor }));
  }

  async function onGuardar(imprimir: boolean) {
    if (!pacienteId) {
      toast.error("Selecciona un paciente");
      return;
    }
    try {
      await guardar.mutateAsync({
        id: inicial?.id,
        paciente_id: pacienteId,
        formato_id: formato.id,
        titulo: formato.titulo,
        respuestas: valores,
      });
      limpiar();
      toast.success("Formato guardado");
      if (imprimir) imprimirFormato(formato, config, valores, nombreStr);
      if (esEntrevistaInicial) {
        setGuardado(true);
      } else {
        onCerrar();
      }
    } catch {
      toast.error("No se pudo guardar (revisa permisos: admin o terapeuta)");
    }
  }

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo={`${inicial ? "Editar" : "Llenar"}: ${formato.titulo}`}
      className="max-w-3xl"
    >
      <div className="space-y-4">
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

        <FormatoFiller formato={formato} valores={valores} onChange={set} />

        {esEntrevistaInicial && guardado && (
          <div className="rounded-lg border border-luda-lila/15 bg-luda-lila-light/30 p-3">
            <p className="mb-2 text-xs text-luda-gris-light">
              Entrevista guardada ✓. Puedes pedirle a la IA una propuesta de
              plan de intervención (objetivos, sesiones y precio) con base en
              esta información.
            </p>
            <SugerenciaPlanBoton
              pacienteId={pacienteId}
              datos={{
                nombrePaciente: nombreStr,
                fechaNacimiento: pacienteNombre?.fecha_nacimiento,
                motivoConsulta: pacienteNombre?.motivo_consulta,
                diagnosticoPrincipal: pacienteNombre?.diagnostico_principal,
                diagnosticosSecundarios:
                  pacienteNombre?.diagnosticos_secundarios ?? undefined,
                informacionMedica: pacienteNombre?.informacion_medica,
                entrevistaRespuestas: respuestasATexto(formato, valores),
              }}
            />
          </div>
        )}

        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-luda-lila/15 bg-white pt-3">
          <Button type="button" variant="ghost" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onGuardar(false)}
            disabled={guardar.isPending}
          >
            Guardar
          </Button>
          <Button
            type="button"
            onClick={() => onGuardar(true)}
            disabled={guardar.isPending}
          >
            <Printer className="h-4 w-4" /> Guardar e imprimir
          </Button>
        </div>
      </div>
    </Modal>
  );
}
