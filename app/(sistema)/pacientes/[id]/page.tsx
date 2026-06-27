import type { Metadata } from "next";

import { ExpedienteCliente } from "@/components/pacientes/expediente-cliente";

export const metadata: Metadata = { title: "Expediente · Ludimente" };

export default function ExpedientePage({
  params,
}: {
  params: { id: string };
}) {
  return <ExpedienteCliente id={params.id} />;
}
