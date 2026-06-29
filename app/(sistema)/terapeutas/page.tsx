import type { Metadata } from "next";

import { TerapeutasCliente } from "@/components/terapeutas/terapeutas-cliente";

export const metadata: Metadata = { title: "Terapeutas · Ludimente" };

export default function TerapeutasPage() {
  return <TerapeutasCliente />;
}
