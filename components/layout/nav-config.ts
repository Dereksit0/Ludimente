import {
  BookOpen,
  Boxes,
  Calendar,
  CalendarRange,
  ClipboardCheck,
  ClipboardList,
  FileBarChart,
  FileSignature,
  FileText,
  LayoutDashboard,
  LineChart,
  PiggyBank,
  Settings,
  Target,
  UserCog,
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
  /** Sinónimos para el buscador global (además del label). */
  keywords?: string[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Inicio",
    icon: LayoutDashboard,
    mobile: true,
    keywords: ["dashboard", "resumen", "panel", "home"],
  },
  {
    href: "/pacientes",
    label: "Pacientes",
    icon: Users,
    mobile: true,
    keywords: ["niños", "expedientes", "alumnos"],
  },
  {
    href: "/agenda",
    label: "Agenda",
    icon: Calendar,
    mobile: true,
    keywords: ["citas", "calendario", "horario"],
  },
  {
    href: "/evaluaciones",
    label: "Evaluaciones",
    icon: ClipboardList,
    roles: ["admin", "psicologo"],
    keywords: ["pruebas", "tests", "informes psicológicos"],
  },
  {
    href: "/tamizaje",
    label: "Tamizaje",
    icon: ClipboardCheck,
    roles: ["admin", "psicologo"],
    keywords: [
      "tamizaje inicial",
      "evaluacion base",
      "nivel por area",
      "trazo lenguaje matematicas",
      "como vienen los pacientes",
      "screening",
    ],
  },
  {
    href: "/formatos",
    label: "Formatos",
    icon: FileText,
    roles: ["admin", "psicologo", "recepcionista"],
    keywords: [
      "formatos imprimibles",
      "hojas de registro",
      "entrevista inicial",
      "perfil sensorial",
      "pruebas en blanco",
      "anamnesis",
    ],
  },
  {
    href: "/planeacion",
    label: "Planeación",
    icon: CalendarRange,
    roles: ["admin", "psicologo", "recepcionista"],
    keywords: [
      "planeacion semanal",
      "plan semanal",
      "agenda terapeutica",
      "objetivos sesion",
      "cubrir terapeuta",
      "horario paciente",
    ],
  },
  {
    href: "/planes",
    label: "Planes",
    icon: Target,
    roles: ["admin", "psicologo"],
    keywords: [
      "plan de intervencion",
      "objetivos",
      "metas",
      "terapia",
      "tratamiento",
    ],
  },
  {
    href: "/progreso",
    label: "Progreso",
    icon: LineChart,
    roles: ["admin", "psicologo"],
    keywords: [
      "reportes de progreso",
      "informe padres",
      "avance",
      "familia",
    ],
  },
  {
    href: "/cobranza",
    label: "Cobranza",
    icon: Wallet,
    roles: ["admin"],
    keywords: ["pagos", "cobros", "facturas", "dinero", "deudas"],
  },
  {
    href: "/finanzas",
    label: "Finanzas",
    icon: PiggyBank,
    roles: ["admin"],
    keywords: ["gastos", "egresos", "utilidad", "ingresos", "contabilidad"],
  },
  {
    href: "/consentimientos",
    label: "Consentimientos",
    icon: FileSignature,
    roles: ["admin", "recepcionista"],
    keywords: [
      "consentimiento",
      "firma",
      "aviso de privacidad",
      "autorizacion",
    ],
  },
  {
    href: "/terapeutas",
    label: "Terapeutas",
    icon: UserCog,
    roles: ["admin"],
    keywords: [
      "equipo",
      "psicologos",
      "carga",
      "asignacion",
      "multi-terapeuta",
    ],
  },
  {
    href: "/inventario",
    label: "Inventario",
    icon: Boxes,
    roles: ["admin", "psicologo", "recepcionista"],
    keywords: ["materiales", "tests", "pruebas", "almacen", "prestamos"],
  },
  {
    href: "/biblioteca",
    label: "Biblioteca",
    icon: BookOpen,
    roles: ["admin", "psicologo", "recepcionista"],
    keywords: ["recursos", "actividades", "lecturas", "juegos", "ejercicios"],
  },
  {
    href: "/reportes",
    label: "Reportes",
    icon: FileBarChart,
    roles: ["admin", "psicologo"],
    keywords: ["estadísticas", "gráficas", "métricas"],
  },
  {
    href: "/configuracion",
    label: "Configuración",
    icon: Settings,
    roles: ["admin"],
    keywords: ["ajustes", "settings", "equipo", "usuarios", "perfil"],
  },
];

/** Filtra los items de navegación visibles para un rol dado. */
export function navParaRol(rol: Rol): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(rol));
}
