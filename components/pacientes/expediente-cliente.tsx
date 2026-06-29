"use client";

import Link from "next/link";

import { ArrowLeft } from "lucide-react";

import { ExpedienteHeader } from "@/components/pacientes/expediente-header";
import { CitasTab } from "@/components/pacientes/tabs/citas-tab";
import { ConsentimientosTab } from "@/components/pacientes/tabs/consentimientos-tab";
import { DocumentosTab } from "@/components/pacientes/tabs/documentos-tab";
import { EvaluacionesTab } from "@/components/pacientes/tabs/evaluaciones-tab";
import { InfoTab } from "@/components/pacientes/tabs/info-tab";
import { PagosTab } from "@/components/pacientes/tabs/pagos-tab";
import { PlanTab } from "@/components/pacientes/tabs/plan-tab";
import { PortalTab } from "@/components/pacientes/tabs/portal-tab";
import { ProgresoTab } from "@/components/pacientes/tabs/progreso-tab";
import { SesionesTab } from "@/components/pacientes/tabs/sesiones-tab";
import { TimelineTab } from "@/components/pacientes/tabs/timeline-tab";
import { TutoresTab } from "@/components/pacientes/tabs/tutores-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePaciente } from "@/hooks/use-pacientes";
import { useRolActual } from "@/hooks/use-rol";

export function ExpedienteCliente({ id }: { id: string }) {
  const { data: paciente, isLoading, isError } = usePaciente(id);
  const { data: rol } = useRolActual();
  const esAdmin = rol === "admin";

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="skeleton-luda h-24" />
        <div className="skeleton-luda h-64" />
      </div>
    );
  }

  if (isError || !paciente) {
    return (
      <div className="mx-auto max-w-5xl">
        <Link
          href="/pacientes"
          className="inline-flex items-center gap-1 text-sm font-semibold text-luda-lila-dark"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a pacientes
        </Link>
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          No encontramos este expediente o no tienes acceso a él.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/pacientes"
          className="inline-flex items-center gap-1 text-sm font-semibold text-luda-gris-light hover:text-luda-lila-dark"
        >
          <ArrowLeft className="h-4 w-4" /> Pacientes
        </Link>
      </div>

      <ExpedienteHeader paciente={paciente} />

      <div className="mx-auto max-w-5xl pt-2">
        <Tabs defaultValue="info">
          <TabsList>
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="timeline">Línea de tiempo</TabsTrigger>
            <TabsTrigger value="tutores">Tutores</TabsTrigger>
            <TabsTrigger value="citas">Citas</TabsTrigger>
            <TabsTrigger value="sesiones">Sesiones</TabsTrigger>
            <TabsTrigger value="evaluaciones">Evaluaciones</TabsTrigger>
            <TabsTrigger value="plan">Plan</TabsTrigger>
            <TabsTrigger value="progreso">Progreso</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
            <TabsTrigger value="consentimientos">Consentimientos</TabsTrigger>
            {esAdmin && <TabsTrigger value="pagos">Pagos</TabsTrigger>}
            <TabsTrigger value="portal">Portal</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <InfoTab paciente={paciente} />
          </TabsContent>
          <TabsContent value="timeline">
            <TimelineTab paciente={paciente} />
          </TabsContent>
          <TabsContent value="tutores">
            <TutoresTab paciente={paciente} />
          </TabsContent>
          <TabsContent value="citas">
            <CitasTab paciente={paciente} />
          </TabsContent>
          <TabsContent value="sesiones">
            <SesionesTab paciente={paciente} />
          </TabsContent>
          <TabsContent value="evaluaciones">
            <EvaluacionesTab paciente={paciente} />
          </TabsContent>
          <TabsContent value="plan">
            <PlanTab paciente={paciente} />
          </TabsContent>
          <TabsContent value="progreso">
            <ProgresoTab paciente={paciente} />
          </TabsContent>
          <TabsContent value="documentos">
            <DocumentosTab paciente={paciente} />
          </TabsContent>
          <TabsContent value="consentimientos">
            <ConsentimientosTab paciente={paciente} />
          </TabsContent>
          {esAdmin && (
            <TabsContent value="pagos">
              <PagosTab paciente={paciente} />
            </TabsContent>
          )}
          <TabsContent value="portal">
            <PortalTab paciente={paciente} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
