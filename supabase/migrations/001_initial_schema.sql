-- ════════════════════════════════════════════════════════════
-- LUDIMENTE — 001 Esquema inicial
-- ════════════════════════════════════════════════════════════
create extension if not exists pgcrypto;

-- ─────────────────────────────────────────
-- 1. PROFILES (extiende auth.users)
-- ─────────────────────────────────────────
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  usuario       text unique not null,           -- ID de acceso (lo que escribe al entrar)
  full_name     text not null,
  email         text,                            -- correo de contacto (opcional, NO usado para login)
  phone         text,
  avatar_url    text,
  role          text not null check (role in ('admin','psicologo','recepcionista')),
  especialidad  text,
  cedula_prof   text,
  color_agenda  text default '#C9A8E0',
  activo        boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create unique index if not exists idx_profiles_usuario on profiles(lower(usuario));

-- ─────────────────────────────────────────
-- 2. PACIENTES
-- ─────────────────────────────────────────
create table if not exists pacientes (
  id                       uuid primary key default gen_random_uuid(),
  numero_expediente        text unique not null,
  nombre                   text not null,
  apellido_paterno         text not null,
  apellido_materno         text,
  fecha_nacimiento         date not null,
  sexo                     text check (sexo in ('masculino','femenino','otro')),
  foto_url                 text,
  escuela                  text,
  grado_escolar            text,
  turno_escolar            text check (turno_escolar in ('matutino','vespertino','otro')),
  motivo_consulta          text not null,
  diagnostico_principal    text,
  diagnosticos_secundarios text[],
  psicologo_asignado_id    uuid references profiles(id),
  estatus                  text default 'lista_espera' check (estatus in (
                             'lista_espera','activo','en_evaluacion',
                             'en_intervencion','seguimiento','alta','inactivo')),
  fecha_ingreso            date default current_date,
  fecha_alta               date,
  notas_generales          text,
  alergias                 text,
  medicamentos             text,
  informacion_medica       text,
  created_by               uuid references profiles(id),
  created_at               timestamptz default now(),
  updated_at               timestamptz default now()
);
create index if not exists idx_pacientes_psicologo on pacientes(psicologo_asignado_id);
create index if not exists idx_pacientes_estatus on pacientes(estatus);
create index if not exists idx_pacientes_nombre on pacientes(nombre, apellido_paterno);

-- ─────────────────────────────────────────
-- 3. TUTORES
-- ─────────────────────────────────────────
create table if not exists tutores (
  id                    uuid primary key default gen_random_uuid(),
  paciente_id           uuid not null references pacientes(id) on delete cascade,
  nombre_completo       text not null,
  parentesco            text not null,
  telefono_principal    text not null,
  telefono_alternativo  text,
  email                 text,
  ocupacion             text,
  nivel_estudios        text,
  es_contacto_principal boolean default false,
  vive_con_paciente     boolean default true,
  notas                 text,
  created_at            timestamptz default now()
);
create index if not exists idx_tutores_paciente on tutores(paciente_id);

-- ─────────────────────────────────────────
-- 4. CITAS
-- ─────────────────────────────────────────
create table if not exists citas (
  id                  uuid primary key default gen_random_uuid(),
  paciente_id         uuid not null references pacientes(id),
  psicologo_id        uuid not null references profiles(id),
  fecha_inicio        timestamptz not null,
  fecha_fin           timestamptz not null,
  tipo                text not null check (tipo in (
                        'evaluacion_inicial','sesion_intervencion',
                        'devolucion_resultados','seguimiento',
                        'entrevista_padres','taller','otro')),
  modalidad           text default 'presencial' check (modalidad in ('presencial','videollamada')),
  estatus             text default 'programada' check (estatus in (
                        'programada','confirmada','completada',
                        'cancelada','no_asistio','reagendada')),
  motivo_cancelacion  text,
  notas_previas       text,
  recordatorio_whatsapp_generado boolean default false,
  recordatorio_whatsapp_enviado  boolean default false,
  fecha_recordatorio_enviado     timestamptz,
  recordatorio_enviado_por       uuid references profiles(id),
  cita_original_id    uuid references citas(id),
  created_by          uuid references profiles(id),
  created_at          timestamptz default now(),
  updated_at          timestamptz default now(),
  constraint citas_rango_valido check (fecha_fin > fecha_inicio)
);
create index if not exists idx_citas_fecha on citas(fecha_inicio);
create index if not exists idx_citas_paciente on citas(paciente_id);
create index if not exists idx_citas_psicologo on citas(psicologo_id);
create index if not exists idx_citas_estatus on citas(estatus);

-- ─────────────────────────────────────────
-- 5. SESIONES (nota clínica)
-- ─────────────────────────────────────────
create table if not exists sesiones (
  id                       uuid primary key default gen_random_uuid(),
  cita_id                  uuid unique references citas(id),
  paciente_id              uuid not null references pacientes(id),
  psicologo_id             uuid not null references profiles(id),
  fecha_sesion             date not null,
  numero_sesion            integer not null,
  area_trabajo             text check (area_trabajo in (
                             'lectura','escritura','matematicas','atencion',
                             'memoria','lenguaje','socio_emocional','motor','otro')),
  objetivos_sesion         text not null,
  desarrollo_sesion        text not null,
  tecnicas_utilizadas      text[],
  materiales_usados        text[],
  observaciones_conducta   text,
  logros_sesion            text,
  dificultades_encontradas text,
  humor_paciente           text check (humor_paciente in (
                             'muy_bien','bien','regular','mal','muy_mal')),
  nivel_participacion      integer check (nivel_participacion between 1 and 5),
  plan_siguiente_sesion    text,
  recomendaciones_casa     text,
  borrador                 boolean default true,
  auto_guardado_at         timestamptz,
  finalizada_at            timestamptz,
  created_at               timestamptz default now(),
  updated_at               timestamptz default now()
);
create index if not exists idx_sesiones_paciente on sesiones(paciente_id);
create unique index if not exists idx_sesiones_numero on sesiones(paciente_id, numero_sesion);

-- ─────────────────────────────────────────
-- 6. EVALUACIONES PSICOPEDAGÓGICAS
-- ─────────────────────────────────────────
create table if not exists evaluaciones (
  id                         uuid primary key default gen_random_uuid(),
  paciente_id                uuid not null references pacientes(id),
  psicologo_id               uuid not null references profiles(id),
  tipo_prueba                text not null check (tipo_prueba in (
                               'WISC-V','WPPSI-IV','BENDER-II','PROLEC-R','PROESC',
                               'TALE','ENFEN','CONNERS-3','BASC-3','VINELAND-3',
                               'BAYLEY-4','BEERY-VMI','STROOP','TOUR','OTRO')),
  nombre_personalizado       text,
  fecha_aplicacion           date not null,
  fecha_calificacion         date,
  fecha_entrega              date,
  resultados_raw             jsonb,
  resultados_escalares       jsonb,
  resultados_indices         jsonb,
  ci_total                   integer,
  interpretacion_cualitativa text,
  fortalezas                 text[],
  areas_oportunidad          text[],
  recomendaciones            text,
  estatus                    text default 'en_proceso' check (estatus in (
                               'pendiente','en_proceso','calificada','entregada','archivada')),
  created_at                 timestamptz default now(),
  updated_at                 timestamptz default now()
);
create index if not exists idx_evaluaciones_paciente on evaluaciones(paciente_id);
create index if not exists idx_evaluaciones_estatus on evaluaciones(estatus);

create table if not exists evaluacion_subpruebas (
  id                 uuid primary key default gen_random_uuid(),
  evaluacion_id      uuid not null references evaluaciones(id) on delete cascade,
  nombre_subprueba   text not null,
  puntuacion_directa numeric,
  puntuacion_escalar numeric,
  percentil          numeric,
  categoria          text,
  notas              text
);
create index if not exists idx_subpruebas_evaluacion on evaluacion_subpruebas(evaluacion_id);

-- ─────────────────────────────────────────
-- 7. DOCUMENTOS
-- ─────────────────────────────────────────
create table if not exists documentos (
  id                    uuid primary key default gen_random_uuid(),
  paciente_id           uuid not null references pacientes(id),
  evaluacion_id         uuid references evaluaciones(id),
  sesion_id             uuid references sesiones(id),
  nombre_display        text not null,
  nombre_archivo        text not null,
  tipo                  text not null check (tipo in (
                          'reporte_evaluacion','nota_sesion','consentimiento_informado',
                          'carta_referencia','estudio_medico','credencial','otro')),
  storage_path          text not null,
  mime_type             text,
  tamanio_bytes         bigint,
  version               integer default 1,
  visible_portal_padres boolean default false,
  subido_por            uuid references profiles(id),
  created_at            timestamptz default now()
);
create index if not exists idx_documentos_paciente on documentos(paciente_id);

-- ─────────────────────────────────────────
-- 8. PAGOS
-- ─────────────────────────────────────────
create table if not exists pagos (
  id          uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references pacientes(id),
  cita_id     uuid references citas(id),
  concepto    text not null,
  monto       numeric(10,2) not null check (monto > 0),
  descuento   numeric(10,2) default 0,
  monto_final numeric(10,2) generated always as (monto - descuento) stored,
  metodo_pago text not null check (metodo_pago in (
                'efectivo','transferencia','tarjeta_debito',
                'tarjeta_credito','otro')),
  estatus     text default 'pendiente' check (estatus in (
                'pendiente','pagado','cancelado','reembolsado')),
  fecha_pago  timestamptz,
  referencia  text,
  notas       text,
  created_by  uuid references profiles(id),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create index if not exists idx_pagos_paciente on pagos(paciente_id);
create index if not exists idx_pagos_fecha on pagos(fecha_pago);

-- ─────────────────────────────────────────
-- 9. AUDIT LOG
-- ─────────────────────────────────────────
create table if not exists audit_log (
  id            uuid primary key default gen_random_uuid(),
  tabla         text not null,
  registro_id   uuid not null,
  accion        text not null check (accion in ('INSERT','UPDATE','DELETE','VIEW')),
  usuario_id    uuid references profiles(id),
  datos_antes   jsonb,
  datos_despues jsonb,
  ip_address    inet,
  created_at    timestamptz default now()
);
create index if not exists idx_audit_registro on audit_log(tabla, registro_id);

-- ─────────────────────────────────────────
-- 10. PORTAL DE PAPÁS
-- ─────────────────────────────────────────
create table if not exists portal_accesos (
  id            uuid primary key default gen_random_uuid(),
  tutor_id      uuid not null references tutores(id),
  paciente_id   uuid not null references pacientes(id),
  codigo_acceso text unique not null,
  pin_hash      text,
  activo        boolean default false,
  ultimo_acceso timestamptz,
  created_at    timestamptz default now(),
  expires_at    timestamptz
);
create index if not exists idx_portal_codigo on portal_accesos(codigo_acceso);

-- ─────────────────────────────────────────
-- 11. CONFIGURACIÓN DEL CONSULTORIO
-- ─────────────────────────────────────────
create table if not exists configuracion (
  id                     uuid primary key default gen_random_uuid(),
  nombre_consultorio     text default 'Ludimente',
  slogan                 text default 'Donde aprender es jugar',
  logo_url               text,
  direccion              text,
  telefono               text,
  email                  text,
  sitio_web              text,
  horario_inicio         time default '09:00',
  horario_fin            time default '18:00',
  dias_laborales         text[] default array['lunes','martes','miercoles','jueves','viernes'],
  duracion_sesion_mins   integer default 50,
  precio_sesion_default  numeric(10,2) default 500.00,
  moneda                 text default 'MXN',
  plantilla_recordatorio text default '¡Hola! Te recordamos que {nombre_paciente} tiene cita en Ludimente el {fecha} a las {hora}. 🐙⭐ Cualquier duda, escríbenos.',
  plantilla_confirmacion text default '¡Hola! Confirmamos la cita de {nombre_paciente} para el {fecha} a las {hora}. 🧠 ¡Nos vemos pronto! — Equipo Ludimente',
  plantilla_bienvenida   text default '¡Bienvenido/a a Ludimente, {nombre_tutor}! 🐙 Nos alegra tener a {nombre_paciente} con nosotros. Pronto te contactaremos para agendar su primera cita.',
  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);
