import type { Metadata } from "next";

import { ConsentimientosCliente } from "@/components/consentimientos/consentimientos-cliente";

export const metadata: Metadata = { title: "Consentimientos · Ludimente" };

export default function ConsentimientosPage() {
  return <ConsentimientosCliente />;
}
