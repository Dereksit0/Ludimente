-- ════════════════════════════════════════════════════════════
-- LUDIMENTE — 005 Storage (fotos/documentos) + RPC de alta de paciente
-- ════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- Buckets de almacenamiento
--   pacientes-fotos : avatar del paciente (privado, vía URL firmada)
--   documentos      : expedientes, reportes, etc. (privado)
-- ─────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('pacientes-fotos', 'pacientes-fotos', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', false)
on conflict (id) do nothing;

-- Políticas: cualquier usuario autenticado del equipo puede leer/subir.
-- (El acceso fino por paciente se controla en la capa de aplicación con URLs firmadas.)
do $$
begin
  -- Limpiar políticas previas si se re-ejecuta
  drop policy if exists "equipo lee fotos" on storage.objects;
  drop policy if exists "equipo sube fotos" on storage.objects;
  drop policy if exists "equipo lee documentos" on storage.objects;
  drop policy if exists "equipo sube documentos" on storage.objects;
end$$;

create policy "equipo lee fotos" on storage.objects
  for select to authenticated using (bucket_id = 'pacientes-fotos');
create policy "equipo sube fotos" on storage.objects
  for insert to authenticated with check (bucket_id = 'pacientes-fotos');

create policy "equipo lee documentos" on storage.objects
  for select to authenticated using (bucket_id = 'documentos');
create policy "equipo sube documentos" on storage.objects
  for insert to authenticated with check (bucket_id = 'documentos');

-- ─────────────────────────────────────────
-- RPC: alta de paciente + tutores en una transacción.
--   Respeta RLS (SECURITY INVOKER por defecto): el usuario solo puede
--   crear lo que sus políticas permitan.
--   Devuelve el id del paciente creado.
-- ─────────────────────────────────────────
create or replace function public.crear_paciente_con_tutores(
  p_paciente jsonb,
  p_tutores  jsonb
)
returns uuid
language plpgsql
as $$
declare
  v_paciente_id uuid;
  v_tutor       jsonb;
begin
  insert into public.pacientes (
    nombre, apellido_paterno, apellido_materno, fecha_nacimiento, sexo,
    foto_url, escuela, grado_escolar, turno_escolar, motivo_consulta,
    diagnostico_principal, diagnosticos_secundarios, psicologo_asignado_id,
    estatus, fecha_ingreso, notas_generales, alergias, medicamentos,
    informacion_medica, created_by
  )
  values (
    p_paciente->>'nombre',
    p_paciente->>'apellido_paterno',
    nullif(p_paciente->>'apellido_materno', ''),
    (p_paciente->>'fecha_nacimiento')::date,
    nullif(p_paciente->>'sexo', '')::text,
    nullif(p_paciente->>'foto_url', ''),
    nullif(p_paciente->>'escuela', ''),
    nullif(p_paciente->>'grado_escolar', ''),
    nullif(p_paciente->>'turno_escolar', ''),
    p_paciente->>'motivo_consulta',
    nullif(p_paciente->>'diagnostico_principal', ''),
    case
      when p_paciente->'diagnosticos_secundarios' is null then null
      else array(select jsonb_array_elements_text(p_paciente->'diagnosticos_secundarios'))
    end,
    nullif(p_paciente->>'psicologo_asignado_id', '')::uuid,
    coalesce(nullif(p_paciente->>'estatus', ''), 'lista_espera'),
    coalesce((p_paciente->>'fecha_ingreso')::date, current_date),
    nullif(p_paciente->>'notas_generales', ''),
    nullif(p_paciente->>'alergias', ''),
    nullif(p_paciente->>'medicamentos', ''),
    nullif(p_paciente->>'informacion_medica', ''),
    auth.uid()
  )
  returning id into v_paciente_id;

  for v_tutor in select * from jsonb_array_elements(coalesce(p_tutores, '[]'::jsonb))
  loop
    insert into public.tutores (
      paciente_id, nombre_completo, parentesco, telefono_principal,
      telefono_alternativo, email, ocupacion, nivel_estudios,
      es_contacto_principal, vive_con_paciente, notas
    )
    values (
      v_paciente_id,
      v_tutor->>'nombre_completo',
      v_tutor->>'parentesco',
      v_tutor->>'telefono_principal',
      nullif(v_tutor->>'telefono_alternativo', ''),
      nullif(v_tutor->>'email', ''),
      nullif(v_tutor->>'ocupacion', ''),
      nullif(v_tutor->>'nivel_estudios', ''),
      coalesce((v_tutor->>'es_contacto_principal')::boolean, false),
      coalesce((v_tutor->>'vive_con_paciente')::boolean, true),
      nullif(v_tutor->>'notas', '')
    );
  end loop;

  return v_paciente_id;
end;
$$;
