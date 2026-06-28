import type { Metadata } from "next";

import { CobranzaCliente } from "@/components/cobranza/cobranza-cliente";

export const metadata: Metadata = { title: "Cobranza · Ludimente" };

export default function CobranzaPage() {
  return <CobranzaCliente />;
}
