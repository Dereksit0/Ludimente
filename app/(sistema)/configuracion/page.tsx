import type { Metadata } from "next";

import { ConfiguracionCliente } from "@/components/configuracion/configuracion-cliente";

export const metadata: Metadata = { title: "Configuración · Ludimente" };

export default function ConfiguracionPage() {
  return <ConfiguracionCliente />;
}
