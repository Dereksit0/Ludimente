"use client";

import { useState } from "react";

import { Phone, Plus, Star, Trash2, UserPen } from "lucide-react";
import { toast } from "sonner";

import { TutorForm } from "@/components/pacientes/tutor-form";
import { Button } from "@/components/ui/button";
import { LudaCard } from "@/components/ui/luda-card";
import { Modal } from "@/components/ui/modal";
import {
  useActualizarTutor,
  useCrearTutor,
  useEliminarTutor,
} from "@/hooks/use-tutores";
import type { PacienteDetalle } from "@/hooks/use-pacientes";
import type { TutorInput } from "@/lib/validations/paciente.schema";
import type { Tutor } from "@/types/app.types";

/** Convierte un tutor de la BD (con nulls) al shape del formulario. */
function tutorAInput(t: Tutor): Partial<TutorInput> {
  return {
    nombre_completo: t.nombre_completo,
    parentesco: t.parentesco,
    telefono_principal: t.telefono_principal,
    telefono_alternativo: t.telefono_alternativo ?? "",
    email: t.email ?? "",
    ocupacion: t.ocupacion ?? "",
    nivel_estudios: t.nivel_estudios ?? "",
    es_contacto_principal: t.es_contacto_principal,
    vive_con_paciente: t.vive_con_paciente,
    notas: t.notas ?? "",
  };
}

export function TutoresTab({ paciente }: { paciente: PacienteDetalle }) {
  const crear = useCrearTutor(paciente.id);
  const actualizar = useActualizarTutor(paciente.id);
  const eliminar = useEliminarTutor(paciente.id);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Tutor | null>(null);

  function abrirNuevo() {
    setEditando(null);
    setModalAbierto(true);
  }
  function abrirEdicion(t: Tutor) {
    setEditando(t);
    setModalAbierto(true);
  }

  function onGuardar(valores: TutorInput) {
    if (editando) {
      actualizar.mutate(
        { id: editando.id, cambios: valores },
        {
          onSuccess: () => {
            toast.success("Tutor actualizado ⭐");
            setModalAbierto(false);
          },
          onError: () => toast.error("No se pudo actualizar el tutor."),
        },
      );
    } else {
      crear.mutate(valores, {
        onSuccess: () => {
          toast.success("Tutor agregado ⭐");
          setModalAbierto(false);
        },
        onError: () => toast.error("No se pudo agregar el tutor."),
      });
    }
  }

  function onEliminar(t: Tutor) {
    if (!confirm(`¿Eliminar a ${t.nombre_completo}?`)) return;
    eliminar.mutate(t.id, {
      onSuccess: () => toast.success("Tutor eliminado"),
      onError: () => toast.error("No se pudo eliminar el tutor."),
    });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-luda-gris-light">
          {paciente.tutores.length} de 4 tutores registrados
        </p>
        {paciente.tutores.length < 4 && (
          <Button size="sm" onClick={abrirNuevo}>
            <Plus /> Agregar tutor
          </Button>
        )}
      </div>

      {paciente.tutores.length === 0 ? (
        <LudaCard className="p-8 text-center text-sm text-luda-gris-light">
          Aún no hay tutores registrados. 🐙
        </LudaCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {paciente.tutores.map((t) => (
            <LudaCard key={t.id} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-bold text-luda-gris">
                    {t.nombre_completo}
                    {t.es_contacto_principal && (
                      <Star className="h-4 w-4 fill-luda-amarillo text-luda-amarillo" />
                    )}
                  </p>
                  <p className="text-xs font-semibold text-luda-gris-light">
                    {t.parentesco}
                    {t.vive_con_paciente ? " · Vive con el paciente" : ""}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => abrirEdicion(t)}
                    aria-label="Editar tutor"
                    className="rounded-lg p-1.5 text-luda-gris-light hover:bg-luda-lila-light hover:text-luda-lila-dark"
                  >
                    <UserPen className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEliminar(t)}
                    aria-label="Eliminar tutor"
                    className="rounded-lg p-1.5 text-luda-gris-light hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3 space-y-1 text-sm">
                <a
                  href={`tel:${t.telefono_principal}`}
                  className="flex items-center gap-2 text-luda-gris hover:text-luda-lila-dark"
                >
                  <Phone className="h-4 w-4 text-luda-gris-light" />
                  {t.telefono_principal}
                </a>
                {t.email && (
                  <p className="truncate text-luda-gris-light">{t.email}</p>
                )}
                {t.ocupacion && (
                  <p className="text-luda-gris-light">{t.ocupacion}</p>
                )}
              </div>
            </LudaCard>
          ))}
        </div>
      )}

      <Modal
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        titulo={editando ? "Editar tutor" : "Nuevo tutor"}
      >
        <TutorForm
          key={editando?.id ?? "nuevo"}
          inicial={editando ? tutorAInput(editando) : undefined}
          guardando={crear.isPending || actualizar.isPending}
          onGuardar={onGuardar}
        />
      </Modal>
    </div>
  );
}
