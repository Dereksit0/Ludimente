import {
  Calendar,
  ClipboardList,
  FileBarChart,
  LayoutDashboard,
  Settings,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import type { Rol } from "@/types/database.types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Roles con acceso. Si se omite, todos los roles lo ven. */
  roles?: Rol[];
  /** Mostrar en la barra inferior de mobile. */
  mobile?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard, mobile: true },
  { href: "/pacientes", label: "Pacientes", icon: Users, mobile: true },
  { href: "/agenda", label: "Agenda", icon: Calendar, mobile: true },
  { href: "/evaluaciones", label: "Evaluaciones", icon: ClipboardList, roles: ["admin", "psicologo"] },
  { href: "/cobranza", label: "Cobranza", icon: Wallet, roles: ["admin"] },
  { href: "/reportes", label: "Reportes", icon: FileBarChart, roles: ["admin", "psicologo"] },
  { href: "/configuracion", label: "Configuración", icon: Settings, roles: ["admin"] },
];

/** Filtra los items de navegación visibles para un rol dado. */
export function navParaRol(rol: Rol): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(rol));
}
