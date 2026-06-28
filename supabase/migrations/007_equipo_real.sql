-- ════════════════════════════════════════════════════════════
-- LUDIMENTE — 007 Equipo real + rol en app_metadata
--   • Elimina los usuarios demo (admin, ana.martinez, recepcion).
--   • Crea al equipo real (login por ID, contraseña temporal común).
--   • Embebe role y activo en app_metadata para que el middleware
--     lea el rol desde el token (sin consultar la tabla profiles).
--
--   Equipo:
--     arely    → admin        (Dirección · Psicopedagoga)
--     susy     → psicologo     (Terapeuta)
--     mourice  → psicologo     (Terapeuta)
--   Contraseña común de todos: Pulpo-Ludi-2026!  (cambiable desde el sistema)
-- ════════════════════════════════════════════════════════════

-- ── 1. Eliminar usuarios demo (cascada borra profiles e identities) ──
delete from auth.users
where email in (
  'admin@acceso.ludimente.mx',
  'ana.martinez@acceso.ludimente.mx',
  'recepcion@acceso.ludimente.mx'
);

-- ── 2. Crear / actualizar equipo real ──
do $$
declare
  v_arely   uuid := 'a0000000-0000-0000-0000-000000000001';
  v_susy    uuid := 'a0000000-0000-0000-0000-000000000002';
  v_mourice uuid := 'a0000000-0000-0000-0000-000000000003';
  v_pass    text := crypt('Pulpo-Ludi-2026!', gen_salt('bf'));
begin
  -- auth.users (token columns en '' para evitar el 500 de GoTrue; ver migración 006)
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token, email_change,
    email_change_token_new, email_change_token_current,
    phone_change, phone_change_token, reauthentication_token
  )
  values
    (v_arely, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'arely@acceso.ludimente.mx', v_pass, now(),
     '{"provider":"email","providers":["email"],"role":"admin","activo":true}',
     '{"usuario":"arely","full_name":"Arely","role":"admin"}', now(), now(),
     '', '', '', '', '', '', '', ''),
    (v_susy, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'susy@acceso.ludimente.mx', v_pass, now(),
     '{"provider":"email","providers":["email"],"role":"psicologo","activo":true}',
     '{"usuario":"susy","full_name":"Susy","role":"psicologo"}', now(), now(),
     '', '', '', '', '', '', '', ''),
    (v_mourice, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'mourice@acceso.ludimente.mx', v_pass, now(),
     '{"provider":"email","providers":["email"],"role":"psicologo","activo":true}',
     '{"usuario":"mourice","full_name":"Mourice","role":"psicologo"}', now(), now(),
     '', '', '', '', '', '', '', '')
  on conflict (id) do update
    set raw_app_meta_data = excluded.raw_app_meta_data,
        raw_user_meta_data = excluded.raw_user_meta_data;

  -- profiles (el trigger handle_new_user crea lo básico; aquí afinamos)
  insert into public.profiles (id, usuario, full_name, email, role, especialidad, color_agenda, activo)
  values
    (v_arely,   'arely',   'Arely',   null, 'admin',     'Psicopedagogía infantil', '#9B70C4', true),
    (v_susy,    'susy',    'Susy',    null, 'psicologo', 'Psicología',              '#A8C8E8', true),
    (v_mourice, 'mourice', 'Mourice', null, 'psicologo', 'Psicología',              '#F2B5C8', true)
  on conflict (id) do update
    set usuario = excluded.usuario, full_name = excluded.full_name,
        role = excluded.role, especialidad = excluded.especialidad,
        color_agenda = excluded.color_agenda, activo = excluded.activo;

  -- identidades de email (requerido por GoTrue para login con password)
  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  )
  values
    (gen_random_uuid(), v_arely, v_arely::text,
     format('{"sub":"%s","email":"arely@acceso.ludimente.mx"}', v_arely)::jsonb, 'email', now(), now(), now()),
    (gen_random_uuid(), v_susy, v_susy::text,
     format('{"sub":"%s","email":"susy@acceso.ludimente.mx"}', v_susy)::jsonb, 'email', now(), now(), now()),
    (gen_random_uuid(), v_mourice, v_mourice::text,
     format('{"sub":"%s","email":"mourice@acceso.ludimente.mx"}', v_mourice)::jsonb, 'email', now(), now(), now())
  on conflict do nothing;
end$$;
