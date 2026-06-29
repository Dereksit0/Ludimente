"use client";

import Link from "next/link";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FileSignature, Plus, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LudaCard } from "@/components/ui/luda-card";
import { useConsentimientos } from "@/hooks/use-consentimientos";
import { useConfiguracion } from "@/hooks/use-configuracion";
import { TIPO_CONSENTIMIENTO_LABEL } from "@/lib/catalogos";
import { imprimirConsentimiento } from "@/lib/print-consentimiento";
import type { PacienteDetalle } from "@/hooks/use-pacientes";

export function ConsentimientosTab({
  paciente,
}: {
  paciente: PacienteDetalle;
}) {
  const { data: todos = [], isLoading } = useConsentimientos();
  const { data: config } = useConfiguracion();
  const lista = todos.filter((c) => c.paciente_id === paciente.id);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-luda-gris-light">
          Consentimientos y autorizaciones
        </p>
        <Button asChild size="sm" variant="outline">
          <Link href="/consentimientos">
            <Plus className="h-4 w-4" /> Nuevo
          </Link>
        </Button>
      </div>

      {isLoading && <p className="text-sm text-luda-gris-light">Cargando…</p>}

      {!isLoading && lista.length === 0 && (
        <LudaCard className="p-6 text-center">
          <FileSignature className="mx-auto h-8 w-8 text-luda-lila" />
          <p className="mt-2 text-sm text-luda-gris-light">
            Sin consentimientos. Crea uno desde el módulo Consentimientos.
          </p>
        </LudaCard>
      )}

      {lista.map((c) => (
        <LudaCard key={c.id} className="flex flex-wrap items-center gap-3 p-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-luda-gris">{c.titulo}</p>
            <p className="text-xs text-luda-gris-light">
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
                    ? format(new Date(c.firmado_at), "d MMM yyyy", { locale: es })
                    : ""
                }`
              : "Pendiente"}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => imprimirConsentimiento(c, config)}
          >
            <Printer className="h-4 w-4" /> Imprimir
          </Button>
        </LudaCard>
      ))}
    </div>
  );
}
