import type { Metadata } from "next";

import { PlanDetalle } from "@/components/planes/plan-detalle";

export const metadata: Metadata = { title: "Plan de intervención · Ludimente" };

export default function PlanPage({ params }: { params: { id: string } }) {
  return <PlanDetalle id={params.id} />;
}
