import type { Metadata } from "next";

import { FormNuevoPaciente } from "@/components/pacientes/form-nuevo-paciente";

export const metadata: Metadata = { title: "Nuevo paciente · Ludimente" };

export default function NuevoPacientePage() {
  return <FormNuevoPaciente />;
}
