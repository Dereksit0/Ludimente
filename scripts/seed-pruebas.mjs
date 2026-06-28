/**
 * Datos de prueba para Ludimente.
 *   Ejecuta:  node scripts/seed-pruebas.mjs
 * Limpia los datos clínicos previos y carga un set realista para pruebas.
 * NO toca los usuarios del equipo (profiles / auth.users).
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// IDs fijos del equipo (migración 007)
const ARELY = "a0000000-0000-0000-0000-000000000001";
const SUSY = "a0000000-0000-0000-0000-000000000002";
const MOURICE = "a0000000-0000-0000-0000-000000000003";

// Helpers de fecha relativos a hoy
const hoy = new Date();
const d = (offsetDias, h = 10, m = 0) => {
  const x = new Date(hoy);
  x.setDate(x.getDate() + offsetDias);
  x.setHours(h, m, 0, 0);
  return x.toISOString();
};
const dia = (offsetDias) => {
  const x = new Date(hoy);
  x.setDate(x.getDate() + offsetDias);
  return x.toISOString().slice(0, 10);
};

async function limpiar() {
  const all = "00000000-0000-0000-0000-000000000000";
  for (const t of [
    "pagos",
    "documentos",
    "evaluacion_subpruebas",
    "evaluaciones",
    "sesiones",
    "portal_accesos",
    "citas",
    "tutores",
    "pacientes",
  ]) {
    const { error } = await db.from(t).delete().neq("id", all);
    if (error) console.warn(`  aviso limpiando ${t}: ${error.message}`);
  }
  // Vaciar bucket de documentos de seeds previos
  const { data: prev } = await db.storage.from("documentos").list("seed");
  if (prev?.length) {
    await db.storage
      .from("documentos")
      .remove(prev.map((f) => `seed/${f.name}`));
  }
  console.log("Limpieza de datos previos OK");
}

// Definición de pacientes de prueba
const PACIENTES = [
  {
    nombre: "Mateo", ap: "Hernández", am: "Ríos", nac: "2017-04-12", sexo: "masculino",
    escuela: "Colegio Anáhuac", grado: "2° primaria", turno: "matutino",
    motivo: "Dificultades en lectoescritura", dx: "Dislexia (en evaluación)",
    estatus: "en_intervencion", psico: SUSY,
    tutores: [
      { nombre: "Laura Ríos", parentesco: "madre", tel: "2221001001", principal: true, email: "laura.rios@example.com" },
      { nombre: "Jorge Hernández", parentesco: "padre", tel: "2221001002" },
    ],
    citas: [
      { off: -14, tipo: "evaluacion_inicial", estatus: "completada" },
      { off: -7, tipo: "sesion_intervencion", estatus: "completada" },
      { off: 0, h: 11, tipo: "sesion_intervencion", estatus: "confirmada" },
      { off: 7, tipo: "sesion_intervencion", estatus: "programada" },
    ],
    sesiones: [
      { off: -14, area: "lectura", logros: "Identificó las vocales sin apoyo.", casa: "Leer un cuento corto 10 min al día.", part: 4 },
      { off: -7, area: "escritura", logros: "Escribió su nombre completo.", casa: "Practicar trazos en el cuaderno.", part: 5 },
    ],
    evaluacion: { tipo: "PROLEC-R", ci: null, fortalezas: ["Vocabulario", "Memoria visual"], areas: ["Velocidad lectora"], estatus: "calificada",
      sub: [{ n: "Nombre de letras", pd: 18, pc: 35 }, { n: "Lectura de palabras", pd: 22, pc: 28 }] },
    pagos: [
      { off: -14, concepto: "Evaluación inicial", monto: 800, metodo: "transferencia", estatus: "pagado" },
      { off: -7, concepto: "Sesión de intervención", monto: 500, metodo: "efectivo", estatus: "pagado" },
      { off: 0, concepto: "Sesión de intervención", monto: 500, metodo: "efectivo", estatus: "pendiente" },
    ],
    docVisible: true,
  },
  {
    nombre: "Valentina", ap: "Gómez", am: "Luna", nac: "2016-09-03", sexo: "femenino",
    escuela: "Instituto Oriente", grado: "3° primaria", turno: "matutino",
    motivo: "Problemas de atención y concentración", dx: "TDAH (presentación inatenta)",
    estatus: "activo", psico: MOURICE,
    tutores: [{ nombre: "Mónica Luna", parentesco: "madre", tel: "2222002001", principal: true, email: "monica.luna@example.com" }],
    citas: [
      { off: -10, tipo: "evaluacion_inicial", estatus: "completada" },
      { off: 0, h: 13, tipo: "seguimiento", estatus: "programada" },
      { off: 14, tipo: "sesion_intervencion", estatus: "programada" },
    ],
    sesiones: [
      { off: -10, area: "atencion", logros: "Completó una actividad de 15 min sin distraerse.", casa: "Rutina de tareas con temporizador.", part: 4 },
    ],
    evaluacion: { tipo: "CONNERS-3", ci: null, fortalezas: ["Creatividad"], areas: ["Atención sostenida", "Organización"], estatus: "entregada",
      sub: [{ n: "Inatención", pd: 24, pc: 88 }, { n: "Hiperactividad", pd: 12, pc: 60 }] },
    pagos: [{ off: -10, concepto: "Evaluación inicial", monto: 800, metodo: "tarjeta_debito", estatus: "pagado" }],
    docVisible: false,
  },
  {
    nombre: "Diego", ap: "Martínez", am: "Sánchez", nac: "2018-01-25", sexo: "masculino",
    escuela: "Kínder Montessori", grado: "Preescolar 3", turno: "matutino",
    motivo: "Retraso en lenguaje expresivo", dx: null,
    estatus: "en_evaluacion", psico: SUSY,
    tutores: [{ nombre: "Patricia Sánchez", parentesco: "madre", tel: "2223003001", principal: true }],
    citas: [
      { off: -3, tipo: "evaluacion_inicial", estatus: "completada" },
      { off: 5, tipo: "devolucion_resultados", estatus: "programada" },
    ],
    sesiones: [],
    evaluacion: { tipo: "WPPSI-IV", ci: 96, fortalezas: ["Razonamiento perceptual"], areas: ["Comprensión verbal"], estatus: "en_proceso",
      sub: [{ n: "Información", pd: 14, pc: 50 }, { n: "Cubos", pd: 20, pc: 63 }] },
    pagos: [{ off: -3, concepto: "Evaluación inicial", monto: 800, metodo: "efectivo", estatus: "pagado" }],
    docVisible: false,
  },
  {
    nombre: "Renata", ap: "Flores", am: "Cruz", nac: "2015-11-30", sexo: "femenino",
    escuela: "Colegio Humboldt", grado: "5° primaria", turno: "vespertino",
    motivo: "Dificultades en matemáticas", dx: "Discalculia",
    estatus: "seguimiento", psico: MOURICE,
    tutores: [{ nombre: "Carlos Flores", parentesco: "padre", tel: "2224004001", principal: true, email: "carlos.flores@example.com" }],
    citas: [
      { off: -30, tipo: "sesion_intervencion", estatus: "completada" },
      { off: -2, tipo: "seguimiento", estatus: "no_asistio" },
      { off: 10, tipo: "seguimiento", estatus: "programada" },
    ],
    sesiones: [
      { off: -30, area: "matematicas", logros: "Resolvió sumas con llevadas.", casa: "Juegos de conteo en casa.", part: 3 },
    ],
    evaluacion: null,
    pagos: [
      { off: -30, concepto: "Sesión de intervención", monto: 500, metodo: "transferencia", estatus: "pagado" },
      { off: -2, concepto: "Seguimiento", monto: 400, metodo: "efectivo", estatus: "cancelado" },
    ],
    docVisible: false,
  },
  {
    nombre: "Santiago", ap: "López", am: null, nac: "2019-06-15", sexo: "masculino",
    escuela: null, grado: null, turno: null,
    motivo: "Evaluación de desarrollo general", dx: null,
    estatus: "lista_espera", psico: null,
    tutores: [{ nombre: "Andrea López", parentesco: "madre", tel: "2225005001", principal: true }],
    citas: [],
    sesiones: [],
    evaluacion: null,
    pagos: [],
    docVisible: false,
  },
  {
    nombre: "Camila", ap: "Torres", am: "Vega", nac: "2014-02-08", sexo: "femenino",
    escuela: "Colegio Britania", grado: "6° primaria", turno: "matutino",
    motivo: "Ansiedad escolar", dx: "Ansiedad (resuelta)",
    estatus: "alta", psico: ARELY,
    tutores: [{ nombre: "Gabriela Vega", parentesco: "madre", tel: "2226006001", principal: true }],
    citas: [{ off: -60, tipo: "sesion_intervencion", estatus: "completada" }],
    sesiones: [
      { off: -60, area: "socio_emocional", logros: "Expresó sus emociones con apoyo de pictogramas.", casa: "Bitácora de emociones.", part: 5 },
    ],
    evaluacion: null,
    pagos: [{ off: -60, concepto: "Sesión de intervención", monto: 500, metodo: "efectivo", estatus: "pagado" }],
    docVisible: false,
  },
];

async function sembrar() {
  // Subir un archivo placeholder reutilizable para documentos visibles
  const contenidoDemo = "Documento de avances de demostración - Ludimente.\n";
  const codigosPortal = [];

  for (const p of PACIENTES) {
    const { data: pac, error: ePac } = await db
      .from("pacientes")
      .insert({
        nombre: p.nombre, apellido_paterno: p.ap, apellido_materno: p.am,
        fecha_nacimiento: p.nac, sexo: p.sexo, escuela: p.escuela,
        grado_escolar: p.grado, turno_escolar: p.turno, motivo_consulta: p.motivo,
        diagnostico_principal: p.dx, psicologo_asignado_id: p.psico,
        estatus: p.estatus, created_by: ARELY,
      })
      .select("id, numero_expediente")
      .single();
    if (ePac) { console.error("paciente", p.nombre, ePac.message); continue; }

    // Tutores
    const tutoresCreados = [];
    for (const t of p.tutores) {
      const { data: tut } = await db
        .from("tutores")
        .insert({
          paciente_id: pac.id, nombre_completo: t.nombre, parentesco: t.parentesco,
          telefono_principal: t.tel, email: t.email ?? null,
          es_contacto_principal: !!t.principal,
        })
        .select("id")
        .single();
      if (tut) tutoresCreados.push({ ...t, id: tut.id });
    }

    // Citas
    for (const c of p.citas) {
      const ini = d(c.off, c.h ?? 10);
      const fin = d(c.off, (c.h ?? 10), 50);
      await db.from("citas").insert({
        paciente_id: pac.id, psicologo_id: p.psico ?? ARELY,
        fecha_inicio: ini, fecha_fin: fin, tipo: c.tipo, estatus: c.estatus,
        created_by: ARELY,
      });
    }

    // Sesiones (finalizadas → visibles en el portal)
    for (const s of p.sesiones) {
      await db.from("sesiones").insert({
        paciente_id: pac.id, psicologo_id: p.psico ?? ARELY, fecha_sesion: dia(s.off),
        area_trabajo: s.area, objetivos_sesion: "Trabajar " + s.area,
        desarrollo_sesion: "Sesión desarrollada con normalidad.",
        logros_sesion: s.logros, recomendaciones_casa: s.casa,
        nivel_participacion: s.part, humor_paciente: "bien",
        borrador: false, finalizada_at: new Date().toISOString(),
      });
    }

    // Evaluación + subpruebas
    if (p.evaluacion) {
      const ev = p.evaluacion;
      const { data: evRow } = await db
        .from("evaluaciones")
        .insert({
          paciente_id: pac.id, psicologo_id: p.psico ?? ARELY, tipo_prueba: ev.tipo,
          fecha_aplicacion: dia(-12), ci_total: ev.ci, fortalezas: ev.fortalezas,
          areas_oportunidad: ev.areas, estatus: ev.estatus,
          interpretacion_cualitativa: "Resultados dentro de lo esperado para su edad.",
        })
        .select("id")
        .single();
      if (evRow && ev.sub) {
        for (const sb of ev.sub) {
          await db.from("evaluacion_subpruebas").insert({
            evaluacion_id: evRow.id, nombre_subprueba: sb.n,
            puntuacion_directa: sb.pd, percentil: sb.pc,
          });
        }
      }
    }

    // Pagos
    for (const pg of p.pagos) {
      await db.from("pagos").insert({
        paciente_id: pac.id, concepto: pg.concepto, monto: pg.monto,
        metodo_pago: pg.metodo, estatus: pg.estatus,
        fecha_pago: pg.estatus === "pagado" ? d(pg.off, 10) : null,
        created_by: ARELY,
      });
    }

    // Documento (uno visible en portal para el primer paciente)
    if (p.docVisible) {
      const path = `seed/${pac.id}-avances.txt`;
      await db.storage.from("documentos").upload(path, contenidoDemo, {
        contentType: "text/plain", upsert: true,
      });
      await db.from("documentos").insert({
        paciente_id: pac.id, nombre_display: "Reporte de avances (demo)",
        nombre_archivo: "avances.txt", tipo: "reporte_evaluacion",
        storage_path: path, mime_type: "text/plain",
        visible_portal_padres: true, subido_por: p.psico ?? ARELY,
      });
    }

    // Acceso al portal para el tutor principal (PIN 1234)
    const principal = tutoresCreados.find((t) => t.principal);
    if (principal && p.estatus !== "lista_espera") {
      const { data: codigo } = await db.rpc("portal_generar_acceso", {
        p_tutor_id: principal.id, p_paciente_id: pac.id, p_pin: "1234",
      });
      if (codigo) codigosPortal.push({ paciente: `${p.nombre} ${p.ap}`, tutor: principal.nombre, codigo });
    }

    console.log(`✓ ${pac.numero_expediente}  ${p.nombre} ${p.ap}  (${p.estatus})`);
  }

  console.log("\n=== Accesos del Portal de Padres (PIN: 1234) ===");
  for (const c of codigosPortal) console.log(`  ${c.codigo}  →  ${c.paciente} · ${c.tutor}`);
}

await limpiar();
await sembrar();
console.log("\nDatos de prueba cargados ✅");
