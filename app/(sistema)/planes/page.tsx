import type { Metadata } from "next";

import { PlanesCliente } from "@/components/planes/planes-cliente";

export const metadata: Metadata = { title: "Planes de intervención · Ludimente" };

export default function PlanesPage() {
  return <PlanesCliente />;
}
