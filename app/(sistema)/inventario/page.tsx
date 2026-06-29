import type { Metadata } from "next";

import { InventarioCliente } from "@/components/inventario/inventario-cliente";

export const metadata: Metadata = { title: "Inventario · Ludimente" };

export default function InventarioPage() {
  return <InventarioCliente />;
}
