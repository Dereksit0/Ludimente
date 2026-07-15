import { createAdminClient } from "@/lib/supabase/admin";

/** Datos que ve el portal de padres para un paciente. Solo lectura. */

export interface PortalAvance {
  fecha: string;
  area: string | null;
  logros: string | null;
  recomendaciones: string | null;
  participacion: number | null;
}

export interface PortalCita {
  id: string;
  fecha: string;
  tipo: string;
  modalidad: string;
  estatus: string;
}

export interface PortalDocumento {
  nombre: string;
  tipo: string;
  url: string | null;
}

export interface PortalPago {
  concepto: string;
  monto: number;
  estatus: string;
  fecha: string | null;
  creado: string;
}

export interface PortalReporte {
  id: string;
  titulo: string;
  periodo_inicio: string | null;
  periodo_fin: string | null;
  resumen: string | null;
  logros: string | null;
  recomendaciones: string | null;
  objetivos: { descripcion: string; area: string; progreso: number }[];
  fecha: string;
}

export interface PortalConsentimiento {
  titulo: string;
  tipo: string;
  firmado: boolean;
  fecha: string | null;
}

export interface PortalObjetivo {
  descripcion: string;
  area: string;
  prioridad: string;
  estatus: string;
  progreso: number;
}

export interface PortalPlan {
  titulo: string;
  descripcion: string | null;
  estatus: string;
  fechaInicio: string;
  objetivos: PortalObjetivo[];
}

export interface PortalSolicitud {
  fechaPreferida: string | null;
  nota: string | null;
  estatus: string;
  creado: string;
}

export interface PortalRecurso {
  titulo: string;
  descripcion: string | null;
  categoria: string;
  url: string | null;
  etiquetas: string[];
}

export async function obtenerAvances(pacienteId: string): Promise<PortalAvance[]> {
  const db = createAdminClient();
  const { data } = await db
    .from("sesiones")
    .select("fecha_sesion, area_trabajo, logros_sesion, recomendaciones_casa, nivel_participacion, borrador")
    .eq("paciente_id", pacienteId)
    .eq("borrador", false)
    .is("deleted_at", null)
    .order("fecha_sesion", { ascending: false })
    .limit(20);

  return (data ?? []).map((s) => ({
    fecha: s.fecha_sesion,
    area: s.area_trabajo,
    logros: s.logros_sesion,
    recomendaciones: s.recomendaciones_casa,
    participacion: s.nivel_participacion,
  }));
}

export async function obtenerProximasCitas(pacienteId: string): Promise<PortalCita[]> {
  const db = createAdminClient();
  const { data } = await db
    .from("citas")
    .select("id, fecha_inicio, tipo, modalidad, estatus")
    .eq("paciente_id", pacienteId)
    .gte("fecha_inicio", new Date().toISOString())
    .in("estatus", ["programada", "confirmada"])
    .order("fecha_inicio", { ascending: true })
    .limit(10);

  return (data ?? []).map((c) => ({
    id: c.id,
    fecha: c.fecha_inicio,
    tipo: c.tipo,
    modalidad: c.modalidad ?? "presencial",
    estatus: c.estatus ?? "programada",
  }));
}

export async function obtenerDocumentos(pacienteId: string): Promise<PortalDocumento[]> {
  const db = createAdminClient();
  const { data } = await db
    .from("documentos")
    .select("nombre_display, tipo, storage_path")
    .eq("paciente_id", pacienteId)
    .eq("visible_portal_padres", true)
    .order("created_at", { ascending: false });

  const docs = data ?? [];
  // URLs firmadas (1 hora) para descarga segura desde el bucket privado.
  const resultados: PortalDocumento[] = [];
  for (const d of docs) {
    const { data: signed } = await db.storage
      .from("documentos")
      .createSignedUrl(d.storage_path, 60 * 60);
    resultados.push({
      nombre: d.nombre_display,
      tipo: d.tipo,
      url: signed?.signedUrl ?? null,
    });
  }
  return resultados;
}

export async function obtenerReportesProgreso(
  pacienteId: string,
): Promise<PortalReporte[]> {
  const db = createAdminClient();
  const { data } = await db
    .from("reportes_progreso")
    .select(
      "id, titulo, periodo_inicio, periodo_fin, resumen, logros, recomendaciones, objetivos_snapshot, created_at",
    )
    .eq("paciente_id", pacienteId)
    .eq("compartido", true)
    .order("created_at", { ascending: false })
    .limit(12);

  return (data ?? []).map((r) => ({
    id: r.id,
    titulo: r.titulo,
    periodo_inicio: r.periodo_inicio,
    periodo_fin: r.periodo_fin,
    resumen: r.resumen,
    logros: r.logros,
    recomendaciones: r.recomendaciones,
    objetivos: Array.isArray(r.objetivos_snapshot)
      ? (r.objetivos_snapshot as PortalReporte["objetivos"])
      : [],
    fecha: r.created_at,
  }));
}

export async function obtenerConsentimientos(
  pacienteId: string,
): Promise<PortalConsentimiento[]> {
  const db = createAdminClient();
  const { data } = await db
    .from("consentimientos")
    .select("titulo, tipo, firmado, firmado_at")
    .eq("paciente_id", pacienteId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((c) => ({
    titulo: c.titulo,
    tipo: c.tipo,
    firmado: c.firmado,
    fecha: c.firmado_at,
  }));
}

/** Plan de intervención vigente (o el más reciente) con sus objetivos y avance. */
export async function obtenerPlanActivo(
  pacienteId: string,
): Promise<PortalPlan | null> {
  const db = createAdminClient();
  const { data: planes } = await db
    .from("planes_intervencion")
    .select("id, titulo, descripcion, estatus, fecha_inicio, created_at")
    .eq("paciente_id", pacienteId)
    .order("created_at", { ascending: false });

  if (!planes || planes.length === 0) return null;
  const plan = planes.find((p) => p.estatus === "activo") ?? planes[0];

  const { data: objetivos } = await db
    .from("objetivos_intervencion")
    .select("descripcion, area, prioridad, estatus, progreso, orden")
    .eq("plan_id", plan.id)
    .order("orden", { ascending: true });

  return {
    titulo: plan.titulo,
    descripcion: plan.descripcion,
    estatus: plan.estatus,
    fechaInicio: plan.fecha_inicio,
    objetivos: (objetivos ?? []).map((o) => ({
      descripcion: o.descripcion,
      area: o.area,
      prioridad: o.prioridad,
      estatus: o.estatus,
      progreso: o.progreso,
    })),
  };
}

/** Últimas solicitudes de cita que hizo el padre, con su estatus real. */
export async function obtenerSolicitudesCita(
  pacienteId: string,
): Promise<PortalSolicitud[]> {
  const db = createAdminClient();
  const { data } = await db
    .from("solicitudes_cita")
    .select("fecha_preferida, nota, estatus, created_at")
    .eq("paciente_id", pacienteId)
    .order("created_at", { ascending: false })
    .limit(5);

  return (data ?? []).map((s) => ({
    fechaPreferida: s.fecha_preferida,
    nota: s.nota,
    estatus: s.estatus,
    creado: s.created_at,
  }));
}

/** Recursos de la biblioteca acordes a la edad del paciente. */
export async function obtenerRecursosParaFamilia(
  pacienteId: string,
): Promise<PortalRecurso[]> {
  const db = createAdminClient();
  const { data: pac } = await db
    .from("pacientes")
    .select("fecha_nacimiento")
    .eq("id", pacienteId)
    .maybeSingle();

  let edad: number | null = null;
  if (pac?.fecha_nacimiento) {
    const nacimiento = new Date(pac.fecha_nacimiento);
    const hoy = new Date();
    edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  }

  const { data } = await db
    .from("recursos")
    .select("titulo, descripcion, categoria, url, etiquetas, edad_min, edad_max")
    .order("created_at", { ascending: false })
    .limit(40);

  const acordes = (data ?? []).filter((r) => {
    if (edad === null) return true;
    if (r.edad_min !== null && edad < r.edad_min) return false;
    if (r.edad_max !== null && edad > r.edad_max) return false;
    return true;
  });

  return acordes.slice(0, 8).map((r) => ({
    titulo: r.titulo,
    descripcion: r.descripcion,
    categoria: r.categoria,
    url: r.url,
    etiquetas: r.etiquetas,
  }));
}

export interface PortalPaquete {
  nombre: string;
  sesionesTotales: number;
  sesionesUsadas: number;
  sesionesRestantes: number;
}

/** Paquete de sesiones vigente (con sesiones disponibles), si tiene uno. */
export async function obtenerPaqueteActivo(
  pacienteId: string,
): Promise<PortalPaquete | null> {
  const db = createAdminClient();
  const { data: paquetes } = await db
    .from("paquetes_paciente")
    .select("nombre, sesiones_totales, sesiones_usadas, created_at")
    .eq("paciente_id", pacienteId)
    .order("created_at", { ascending: false });

  const activo = (paquetes ?? []).find(
    (p) => p.sesiones_totales - p.sesiones_usadas > 0,
  );
  if (!activo) return null;

  return {
    nombre: activo.nombre,
    sesionesTotales: activo.sesiones_totales,
    sesionesUsadas: activo.sesiones_usadas,
    sesionesRestantes: activo.sesiones_totales - activo.sesiones_usadas,
  };
}

export async function obtenerPagos(pacienteId: string): Promise<PortalPago[]> {
  const db = createAdminClient();
  const { data } = await db
    .from("pagos")
    .select("concepto, monto_final, estatus, fecha_pago, created_at")
    .eq("paciente_id", pacienteId)
    .order("created_at", { ascending: false })
    .limit(30);

  return (data ?? []).map((p) => ({
    concepto: p.concepto,
    monto: Number(p.monto_final ?? 0),
    estatus: p.estatus ?? "pendiente",
    fecha: p.fecha_pago,
    creado: p.created_at,
  }));
}
