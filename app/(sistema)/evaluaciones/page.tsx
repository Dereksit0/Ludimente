import type { Metadata } from "next";

import { EvaluacionesCliente } from "@/components/evaluaciones/evaluaciones-cliente";

export const metadata: Metadata = { title: "Evaluaciones · Ludimente" };

export default function EvaluacionesPage() {
  return <EvaluacionesCliente />;
}
