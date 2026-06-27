-- ════════════════════════════════════════════════════════════
-- LUDIMENTE — 004 Datos semilla (desarrollo)
--   Crea 3 usuarios de rol + configuración inicial.
--   Login por ID (usuario), NO por correo.
--     ID: admin       → rol admin
--     ID: ana.martinez → rol psicologo
--     ID: recepcion   → rol recepcionista
--   Contraseña de todos: Ludimente2026!
--   (Internamente el email de auth es <usuario>@acceso.ludimente.mx,
--    dominio no enrutable que nunca recibe correo.)
--   ⚠️  Solo para entorno local / desarrollo.
-- ════════════════════════════════════════════════════════════

-- Configuración base del consultorio (una sola fila)
insert into configuracion (nombre_consultorio, slogan, direccion, telefono, email, sitio_web)
select 'Ludimente', 'Donde aprender es jugar',
       'Puebla, México', '+52 222 000 0000',
       'contacto@ludimente.mx', 'https://ludimente.mx'
where not exists (select 1 from configuracion);

-- ── Usuarios de auth + profiles (vía trigger handle_new_user) ──
do $$
declare
  v_admin   uuid := '11111111-1111-1111-1111-111111111111';
  v_psico   uuid := '22222222-2222-2222-2222-222222222222';
  v_recep   uuid := '33333333-3333-3333-3333-333333333333';
  v_pass    text := crypt('Ludimente2026!', gen_salt('bf'));
begin
  -- Insertar en auth.users solo si no existen
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  )
  values
    (v_admin, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'admin@acceso.ludimente.mx', v_pass, now(),
     '{"provider":"email","providers":["email"]}',
     '{"usuario":"admin","full_name":"Dirección Ludimente","role":"admin"}', now(), now()),
    (v_psico, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'ana.martinez@acceso.ludimente.mx', v_pass, now(),
     '{"provider":"email","providers":["email"]}',
     '{"usuario":"ana.martinez","full_name":"Psic. Ana Martínez","role":"psicologo"}', now(), now()),
    (v_recep, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'recepcion@acceso.ludimente.mx', v_pass, now(),
     '{"provider":"email","providers":["email"]}',
     '{"usuario":"recepcion","full_name":"Recepción Ludimente","role":"recepcionista"}', now(), now())
  on conflict (id) do nothing;

  -- Asegurar profiles (por si el trigger no estuviera activo)
  insert into public.profiles (id, usuario, full_name, email, role, especialidad, color_agenda)
  values
    (v_admin, 'admin', 'Dirección Ludimente', null, 'admin', null, '#9B70C4'),
    (v_psico, 'ana.martinez', 'Psic. Ana Martínez', null, 'psicologo', 'Psicopedagogía infantil', '#A8C8E8'),
    (v_recep, 'recepcion', 'Recepción Ludimente', null, 'recepcionista', null, '#F2B5C8')
  on conflict (id) do update
    set full_name = excluded.full_name, role = excluded.role, usuario = excluded.usuario;

  -- Identidades de email (requerido por GoTrue para login con password)
  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  )
  values
    (gen_random_uuid(), v_admin, v_admin::text,
     format('{"sub":"%s","email":"admin@acceso.ludimente.mx"}', v_admin)::jsonb, 'email', now(), now(), now()),
    (gen_random_uuid(), v_psico, v_psico::text,
     format('{"sub":"%s","email":"ana.martinez@acceso.ludimente.mx"}', v_psico)::jsonb, 'email', now(), now(), now()),
    (gen_random_uuid(), v_recep, v_recep::text,
     format('{"sub":"%s","email":"recepcion@acceso.ludimente.mx"}', v_recep)::jsonb, 'email', now(), now(), now())
  on conflict do nothing;
end$$;
