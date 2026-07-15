"use client";

import { useState } from "react";

import { CalendarPlus, FilePlus2, NotebookPen } from "lucide-react";
import { toast } from "sonner";

import { CitaForm } from "@/components/agenda/cita-form";
import { EstatusControl } from "@/components/pacientes/estatus-control";
import { SubirForm } from "@/components/pacientes/tabs/documentos-tab";
import { SesionForm } from "@/components/pacientes/tabs/sesiones-tab";
import { Button } from "@/components/ui/button";
import { LudaAvatar } from "@/components/ui/luda-avatar";
import { LudaBadge } from "@/components/ui/luda-badge";
import { Modal } from "@/components/ui/modal";
import { PulpitoPaciente } from "@/components/ui/pulpito-paciente";
import { useCrearCita } from "@/hooks/use-citas";
import { useSubirDocumento, type NuevoDocumento } from "@/hooks/use-documentos";
import type { PacienteDetalle } from "@/hooks/use-pacientes";
import { useRolActual } from "@/hooks/use-rol";
import { useCrearSesion } from "@/hooks/use-sesiones";
import { edadLegible } from "@/lib/fechas";
import type { CitaInput } from "@/lib/validations/cita.schema";
import type { SesionInput } from "@/lib/validations/sesion.schema";

type ModalActivo = "cita" | "nota" | "doc" | null;

export function ExpedienteHeader({ paciente }: { paciente: PacienteDetalle }) {
  const nombreCompleto = `${paciente.nombre} ${paciente.apellido_paterno} ${
    paciente.apellido_materno ?? ""
  }`.trim();

  const [modal, setModal] = useState<ModalActivo>(null);
  const crearCita = useCrearCita();
  const crearSesion = useCrearSesion(paciente.id);
  const subirDoc = useSubirDocumento(paciente.id);
  const { data: rol } = useRolActual();
  // Las notas clínicas están vetadas a recepción (RLS: sesiones_no_recepcion).
  const puedeNotas = rol !== "recepcionista";

  async function guardarCita(v: CitaInput) {
    try {
      await crearCita.mutateAsync(v);
      toast.success("Cita creada");
      setModal(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo crear la cita");
    }
  }

  async function guardarNota(v: SesionInput) {
    try {
      await crearSesion.mutateAsync(v);
      toast.success("Nota guardada");
      setModal(null);
    } catch {
      toast.error("No se pudo guardar la nota");
    }
  }

  async function guardarDoc(v: NuevoDocumento) {
    try {
      await subirDoc.mutateAsync(v);
      toast.success("Documento subido");
      setModal(null);
    } catch {
      toast.error("No se pudo subir el documento");
    }
  }

  return (
    <div className="mx-auto max-w-5xl rounded-2xl border border-luda-lila/15 bg-white p-4 shadow-luda md:p-5">
      <div className="flex flex-wrap items-center gap-4">
        <PulpitoPaciente sexo={paciente.sexo} size={64} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold text-luda-gris-light">
              {paciente.numero_expediente}
            </span>
            <LudaBadge tipo="paciente" status={paciente.estatus} />
          </div>
          <h1 className="mt-0.5 truncate font-fredoka text-2xl text-luda-gris">
            {nombreCompleto}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-luda-gris-light">
            <span>{edadLegible(paciente.fecha_nacimiento)}</span>
            {paciente.psicologo && (
              <span className="flex items-center gap-1.5">
                <LudaAvatar
                  nombre={paciente.psicologo.full_name}
                  foto={null}
                  size={18}
                />
                {paciente.psicologo.full_name}
              </span>
            )}
            {paciente.diagnostico_principal && (
              <span className="rounded-full bg-luda-lila-light px-2 py-0.5 font-semibold text-luda-lila-dark">
                {paciente.diagnostico_principal}
              </span>
            )}
          </div>
          <div className="mt-2">
            <EstatusControl paciente={paciente} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setModal("cita")}>
            <CalendarPlus /> <span className="hidden sm:inline">Nueva cita</span>
          </Button>
          {puedeNotas && (
            <Button size="sm" variant="outline" onClick={() => setModal("nota")}>
              <NotebookPen /> <span className="hidden sm:inline">Nueva nota</span>
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setModal("doc")}>
            <FilePlus2 /> <span className="hidden sm:inline">Subir doc</span>
          </Button>
        </div>
      </div>

      {/* Nueva cita */}
      <Modal abierto={modal === "cita"} onCerrar={() => setModal(null)} titulo="Nueva cita">
        <CitaForm
          pacienteFijo={paciente.id}
          inicial={{ psicologo_id: paciente.psicologo_asignado_id ?? undefined }}
          guardando={crearCita.isPending}
          onGuardar={guardarCita}
        />
      </Modal>

      {/* Nueva nota de sesión */}
      <Modal
        abierto={modal === "nota"}
        onCerrar={() => setModal(null)}
        titulo="Nueva nota de sesión"
        className="max-w-2xl"
      >
        <SesionForm
          pacienteId={paciente.id}
          psicologoSugerido={paciente.psicologo_asignado_id ?? undefined}
          guardando={crearSesion.isPending}
          onGuardar={guardarNota}
        />
      </Modal>

      {/* Subir documento */}
      <Modal abierto={modal === "doc"} onCerrar={() => setModal(null)} titulo="Subir documento">
        <SubirForm guardando={subirDoc.isPending} onGuardar={guardarDoc} />
      </Modal>
    </div>
  );
}
