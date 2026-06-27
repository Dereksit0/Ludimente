import type { Metadata } from "next";

import { PacientesCliente } from "@/components/pacientes/pacientes-cliente";

export const metadata: Metadata = { title: "Pacientes · Ludimente" };

export default function PacientesPage() {
  return <PacientesCliente />;
}
