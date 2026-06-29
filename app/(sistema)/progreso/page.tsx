import type { Metadata } from "next";

import { ProgresoCliente } from "@/components/progreso/progreso-cliente";

export const metadata: Metadata = {
  title: "Reportes de progreso · Ludimente",
};

export default function ProgresoPage() {
  return <ProgresoCliente />;
}
