import type {
  AreaObjetivo,
  EstatusCita,
  EstatusObjetivo,
  EstatusPaciente,
  EstatusPago,
  EstatusPlan,
  PrioridadObjetivo,
  Rol,
  Tables,
} from "@/types/database.types";

// ── Entidades compuestas (joins frecuentes) ──
export type Perfil = Tables<"profiles">;
export type Paciente = Tables<"pacientes">;
export type Tutor = Tables<"tutores">;
export type Cita = Tables<"citas">;

export type PacienteConRelaciones = Paciente & {
  tutores: Tutor[];
  psicologo: Pick<Perfil, "id" | "full_name" | "avatar_url" | "color_agenda"> | null;
};

export type CitaConRelaciones = Cita & {
  paciente: Pick<Paciente, "id" | "nombre" | "apellido_paterno" | "numero_expediente">;
  psicologo: Pick<Perfil, "id" | "full_name" | "color_agenda">;
};

// ── Metadatos de UI: etiquetas en español por rol/estatus ──
export const ROL_LABEL: Record<Rol, string> = {
  admin: "Administrador",
  psicologo: "Terapeuta",
  recepcionista: "Recepción",
};

export const ESTATUS_PACIENTE_LABEL: Record<EstatusPaciente, string> = {
  lista_espera: "Lista de espera",
  activo: "Activo",
  en_evaluacion: "En evaluación",
  en_intervencion: "En intervención",
  seguimiento: "Seguimiento",
  alta: "Alta",
  inactivo: "Inactivo",
};

/** Clases Tailwind por estatus de paciente (brief: colores semánticos). */
export const ESTATUS_PACIENTE_CLASES: Record<EstatusPaciente, string> = {
  lista_espera: "bg-purple-50 text-purple-700 border-purple-200",
  activo: "bg-luda-lila-light text-luda-lila-dark border-luda-lila",
  en_evaluacion: "bg-blue-50 text-blue-700 border-blue-200",
  en_intervencion: "bg-green-50 text-green-700 border-green-200",
  seguimiento: "bg-yellow-50 text-yellow-700 border-yellow-200",
  alta: "bg-gray-50 text-gray-600 border-gray-200",
  inactivo: "bg-red-50 text-red-600 border-red-200",
};

export const TIPO_CITA_LABEL: Record<string, string> = {
  evaluacion_inicial: "Evaluación inicial",
  sesion_intervencion: "Sesión de intervención",
  devolucion_resultados: "Devolución de resultados",
  seguimiento: "Seguimiento",
  entrevista_padres: "Entrevista con padres",
  taller: "Taller",
  otro: "Otro",
};

export const ESTATUS_CITA_LABEL: Record<EstatusCita, string> = {
  programada: "Programada",
  confirmada: "Confirmada",
  completada: "Completada",
  cancelada: "Cancelada",
  no_asistio: "No asistió",
  reagendada: "Reagendada",
};

export const ESTATUS_CITA_CLASES: Record<EstatusCita, string> = {
  programada: "bg-luda-azul-light border-luda-azul text-blue-800",
  confirmada: "bg-green-50 border-green-400 text-green-700",
  completada: "bg-gray-50 border-gray-300 text-gray-600",
  cancelada: "bg-red-50 border-red-300 text-red-600",
  no_asistio: "bg-orange-50 border-orange-300 text-orange-700",
  reagendada: "bg-luda-amarillo-light border-luda-amarillo text-yellow-700",
};

export const ESTATUS_PAGO_LABEL: Record<EstatusPago, string> = {
  pendiente: "Pendiente",
  pagado: "Pagado",
  cancelado: "Cancelado",
  reembolsado: "Reembolsado",
};

export const ESTATUS_PAGO_CLASES: Record<EstatusPago, string> = {
  pendiente: "bg-yellow-50 text-yellow-700",
  pagado: "bg-green-50 text-green-700",
  cancelado: "bg-red-50 text-red-600",
  reembolsado: "bg-gray-50 text-gray-600",
};

// ── Plan de intervención ──
export const ESTATUS_PLAN_LABEL: Record<EstatusPlan, string> = {
  activo: "Activo",
  pausado: "Pausado",
  completado: "Completado",
  cancelado: "Cancelado",
};

export const ESTATUS_PLAN_CLASES: Record<EstatusPlan, string> = {
  activo: "bg-green-50 text-green-700 border-green-200",
  pausado: "bg-yellow-50 text-yellow-700 border-yellow-200",
  completado: "bg-luda-lila-light text-luda-lila-dark border-luda-lila",
  cancelado: "bg-gray-50 text-gray-600 border-gray-200",
};

export const AREA_OBJETIVO_LABEL: Record<AreaObjetivo, string> = {
  lenguaje: "Lenguaje",
  aprendizaje: "Aprendizaje",
  conducta: "Conducta",
  motriz: "Motriz",
  socioemocional: "Socioemocional",
  atencion: "Atención",
  autonomia: "Autonomía",
  otro: "Otro",
};

export const PRIORIDAD_OBJETIVO_LABEL: Record<PrioridadObjetivo, string> = {
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

export const PRIORIDAD_OBJETIVO_CLASES: Record<PrioridadObjetivo, string> = {
  alta: "bg-red-50 text-red-600 border-red-200",
  media: "bg-yellow-50 text-yellow-700 border-yellow-200",
  baja: "bg-blue-50 text-blue-700 border-blue-200",
};

export const ESTATUS_OBJETIVO_LABEL: Record<EstatusObjetivo, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  logrado: "Logrado",
  no_logrado: "No logrado",
};

export const ESTATUS_OBJETIVO_CLASES: Record<EstatusObjetivo, string> = {
  pendiente: "bg-gray-50 text-gray-600 border-gray-200",
  en_progreso: "bg-blue-50 text-blue-700 border-blue-200",
  logrado: "bg-green-50 text-green-700 border-green-200",
  no_logrado: "bg-red-50 text-red-600 border-red-200",
};

/** Ruta de aterrizaje por rol tras el login. */
export const RUTA_INICIO_POR_ROL: Record<Rol, string> = {
  admin: "/dashboard",
  psicologo: "/dashboard",
  recepcionista: "/agenda",
};
