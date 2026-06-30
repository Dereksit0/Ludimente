import type { Metadata } from "next";

import { PlaneacionCliente } from "@/components/planeacion/planeacion-cliente";

export const metadata: Metadata = { title: "Planeación · Ludimente" };

export default function PlaneacionPage() {
  return <PlaneacionCliente />;
}
