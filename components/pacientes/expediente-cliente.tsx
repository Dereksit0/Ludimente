"use client";

import Link from "next/link";

import { ArrowLeft } from "lucide-react";

import { ExpedienteHeader } from "@/components/pacientes/expediente-header";
import { InfoTab } from "@/components/pacientes/tabs/info-tab";
import { TutoresTab } from "@/components/pacientes/tabs/tutores-tab";
import { Proximamente } from "@/components/ui/proximamente";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePaciente } from "@/hooks/use-pacientes";

export function ExpedienteCliente({ id }: { id: string }) {
  const { data: paciente, isLoading, isError } = usePaciente(id);

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
      <Link
        href="/pacientes"
        className="inline-flex items-center gap-1 text-sm font-semibold text-luda-gris-light hover:text-luda-lila-dark"
      >
        <ArrowLeft className="h-4 w-4" /> Pacientes
      </Link>

      <ExpedienteHeader paciente={paciente} />

      <div className="mx-auto max-w-5xl pt-2">
        <Tabs defaultValue="info">
          <TabsList>
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="tutores">Tutores</TabsTrigger>
            <TabsTrigger value="citas">Citas</TabsTrigger>
            <TabsTrigger value="sesiones">Sesiones</TabsTrigger>
            <TabsTrigger value="evaluaciones">Evaluaciones</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
            <TabsTrigger value="pagos">Pagos</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <InfoTab paciente={paciente} />
          </TabsContent>
          <TabsContent value="tutores">
            <TutoresTab paciente={paciente} />
          </TabsContent>
          <TabsContent value="citas">
            <Proximamente titulo="Citas" fase="Fase 3" />
          </TabsContent>
          <TabsContent value="sesiones">
            <Proximamente titulo="Sesiones" fase="Fase 4" />
          </TabsContent>
          <TabsContent value="evaluaciones">
            <Proximamente titulo="Evaluaciones" fase="Fase 4" />
          </TabsContent>
          <TabsContent value="documentos">
            <Proximamente titulo="Documentos" fase="Fase 2+" />
          </TabsContent>
          <TabsContent value="pagos">
            <Proximamente titulo="Pagos" fase="Fase 5" />
          </TabsContent>
          <TabsContent value="whatsapp">
            <Proximamente titulo="WhatsApp" fase="Fase 3" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
