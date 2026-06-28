"use client";

import { useEffect, useState } from "react";

import { Copy, KeyRound, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";

import {
  generarAccesoPortal,
  listarAccesosPortal,
  revocarAccesoPortal,
  type AccesoPortal,
} from "@/app/(sistema)/pacientes/portal-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LudaCard } from "@/components/ui/luda-card";
import type { PacienteDetalle } from "@/hooks/use-pacientes";

export function PortalTab({ paciente }: { paciente: PacienteDetalle }) {
  const [accesos, setAccesos] = useState<AccesoPortal[]>([]);
  const [cargando, setCargando] = useState(true);
  const [pins, setPins] = useState<Record<string, string>>({});
  const [ocupado, setOcupado] = useState<string | null>(null);

  async function refrescar() {
    const data = await listarAccesosPortal(paciente.id);
    setAccesos(data);
    setCargando(false);
  }

  useEffect(() => {
    refrescar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paciente.id]);

  async function generar(tutorId: string) {
    const pin = pins[tutorId] ?? "";
    setOcupado(tutorId);
    const res = await generarAccesoPortal({
      tutorId,
      pacienteId: paciente.id,
      pin,
    });
    setOcupado(null);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    setPins((p) => ({ ...p, [tutorId]: "" }));
    await refrescar();
    toast.success(`Acceso creado: ${res.codigo}. Comparte el código y el PIN.`);
  }

  async function revocar(accesoId: string) {
    setOcupado(accesoId);
    await revocarAccesoPortal(accesoId);
    setOcupado(null);
    await refrescar();
    toast.success("Acceso revocado.");
  }

  function copiar(texto: string) {
    navigator.clipboard?.writeText(texto);
    toast.success("Código copiado.");
  }

  if (paciente.tutores.length === 0) {
    return (
      <LudaCard className="p-6">
        <p className="text-sm text-luda-gris-light">
          Primero agrega un tutor en la pestaña <strong>Tutores</strong> para
          poder darle acceso al portal.
        </p>
      </LudaCard>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-luda-gris-light">
        Genera un código de acceso y un PIN para cada tutor. Con ellos podrán
        entrar al <strong>Portal de Padres</strong> a ver avances, citas,
        documentos y pagos.
      </p>

      {paciente.tutores.map((t) => {
        const acceso = accesos.find((a) => a.tutor_id === t.id);
        const trabajando = ocupado === t.id || ocupado === acceso?.id;
        return (
          <LudaCard key={t.id} className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <UserRound className="h-4 w-4 text-luda-lila-dark" />
              <span className="font-bold text-luda-gris">
                {t.nombre_completo}
              </span>
              <span className="text-xs capitalize text-luda-gris-light">
                · {t.parentesco}
              </span>
            </div>

            {acceso ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-xl bg-luda-lila-light px-3 py-2 font-mono text-base font-bold tracking-wider text-luda-lila-dark">
                  <ShieldCheck className="h-4 w-4" />
                  {acceso.codigo_acceso}
                </span>
                <button
                  type="button"
                  onClick={() => copiar(acceso.codigo_acceso)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-luda-lila-dark hover:underline"
                >
                  <Copy className="h-3.5 w-3.5" /> Copiar
                </button>
                <span className="text-xs text-luda-gris-light">
                  {acceso.ultimo_acceso
                    ? `Último acceso: ${new Date(
                        acceso.ultimo_acceso,
                      ).toLocaleDateString("es-MX")}`
                    : "Aún no ha entrado"}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={trabajando}
                  onClick={() => revocar(acceso.id)}
                  className="ml-auto text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" /> Revocar
                </Button>
              </div>
            ) : null}

            <div className="mt-3 flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <Label htmlFor={`pin-${t.id}`} className="text-xs">
                  {acceso ? "Nuevo PIN (4-6 dígitos)" : "PIN (4-6 dígitos)"}
                </Label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-luda-gris-light" />
                  <Input
                    id={`pin-${t.id}`}
                    value={pins[t.id] ?? ""}
                    onChange={(e) =>
                      setPins((p) => ({
                        ...p,
                        [t.id]: e.target.value.replace(/\D/g, "").slice(0, 6),
                      }))
                    }
                    inputMode="numeric"
                    placeholder="••••"
                    className="w-32 pl-9 tracking-widest"
                  />
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                disabled={trabajando || (pins[t.id] ?? "").length < 4}
                onClick={() => generar(t.id)}
              >
                {acceso ? "Regenerar acceso" : "Generar acceso"}
              </Button>
            </div>
          </LudaCard>
        );
      })}

      {cargando && (
        <p className="text-sm text-luda-gris-light">Cargando accesos…</p>
      )}
    </div>
  );
}
