import { z } from "zod";

// ── Paso 1: datos del paciente ──
export const datosPacienteSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio").max(80),
  apellido_paterno: z.string().min(1, "El apellido paterno es obligatorio").max(80),
  apellido_materno: z.string().max(80).optional().or(z.literal("")),
  fecha_nacimiento: z
    .string()
    .min(1, "La fecha de nacimiento es obligatoria")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Fecha inválida")
    .refine((v) => new Date(v) <= new Date(), "La fecha no puede ser futura"),
  sexo: z.enum(["masculino", "femenino", "otro"]).or(z.literal("")).optional(),
  escuela: z.string().max(120).optional().or(z.literal("")),
  grado_escolar: z.string().max(60).optional().or(z.literal("")),
  turno_escolar: z
    .enum(["matutino", "vespertino", "otro"])
    .or(z.literal(""))
    .optional(),
  motivo_consulta: z
    .string()
    .min(5, "Describe brevemente el motivo de consulta")
    .max(1000),
});

// ── Paso 2: información médica ──
export const infoMedicaSchema = z.object({
  diagnostico_principal: z.string().max(160).optional().or(z.literal("")),
  diagnosticos_secundarios: z.array(z.string().max(160)).default([]),
  alergias: z.string().max(500).optional().or(z.literal("")),
  medicamentos: z.string().max(500).optional().or(z.literal("")),
  informacion_medica: z.string().max(1000).optional().or(z.literal("")),
});

// ── Paso 3: tutores ──
export const tutorSchema = z.object({
  nombre_completo: z.string().min(1, "El nombre del tutor es obligatorio").max(120),
  parentesco: z.string().min(1, "El parentesco es obligatorio").max(60),
  telefono_principal: z
    .string()
    .min(10, "El teléfono debe tener al menos 10 dígitos")
    .max(20)
    .regex(/^[\d\s+()-]+$/, "Teléfono inválido"),
  telefono_alternativo: z.string().max(20).optional().or(z.literal("")),
  email: z.string().email("Correo inválido").optional().or(z.literal("")),
  ocupacion: z.string().max(80).optional().or(z.literal("")),
  nivel_estudios: z.string().max(60).optional().or(z.literal("")),
  es_contacto_principal: z.boolean().default(false),
  vive_con_paciente: z.boolean().default(true),
  notas: z.string().max(500).optional().or(z.literal("")),
});

// ── Paso 4: asignación ──
export const asignacionSchema = z.object({
  psicologo_asignado_id: z.string().uuid().optional().or(z.literal("")),
  estatus: z.enum([
    "lista_espera",
    "activo",
    "en_evaluacion",
    "en_intervencion",
    "seguimiento",
    "alta",
    "inactivo",
  ]),
  fecha_ingreso: z
    .string()
    .min(1, "La fecha de ingreso es obligatoria")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Fecha inválida"),
  notas_generales: z.string().max(1000).optional().or(z.literal("")),
});

// ── Formulario completo (todos los pasos) ──
export const nuevoPacienteSchema = datosPacienteSchema
  .merge(infoMedicaSchema)
  .merge(asignacionSchema)
  .extend({
    foto_url: z.string().optional().or(z.literal("")),
    tutores: z
      .array(tutorSchema)
      .min(1, "Agrega al menos un tutor")
      .max(4, "Máximo 4 tutores")
      .refine(
        (tutores) => tutores.filter((t) => t.es_contacto_principal).length <= 1,
        "Solo un tutor puede ser el contacto principal",
      ),
  });

export type DatosPacienteInput = z.infer<typeof datosPacienteSchema>;
export type InfoMedicaInput = z.infer<typeof infoMedicaSchema>;
export type TutorInput = z.infer<typeof tutorSchema>;
export type AsignacionInput = z.infer<typeof asignacionSchema>;
export type NuevoPacienteInput = z.infer<typeof nuevoPacienteSchema>;

// ── Edición in-place de un campo del paciente (Tab Información) ──
export const editarPacienteSchema = datosPacienteSchema
  .merge(infoMedicaSchema)
  .merge(
    z.object({
      psicologo_asignado_id: z.string().uuid().nullable().optional(),
      estatus: asignacionSchema.shape.estatus,
      notas_generales: z.string().max(1000).optional().or(z.literal("")),
    }),
  )
  .partial();

export type EditarPacienteInput = z.infer<typeof editarPacienteSchema>;
