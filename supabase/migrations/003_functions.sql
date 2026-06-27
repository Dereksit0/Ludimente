-- ════════════════════════════════════════════════════════════
-- LUDIMENTE — 003 Funciones, triggers y automatizaciones
-- ════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- updated_at automático
-- ─────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'profiles','pacientes','citas','sesiones','evaluaciones','pagos','configuracion'
  ] loop
    execute format(
      'drop trigger if exists trg_updated_at on %I; '
      'create trigger trg_updated_at before update on %I '
      'for each row execute function public.set_updated_at();', t, t);
  end loop;
end$$;

-- ─────────────────────────────────────────
-- Crear profile automático al registrar un usuario en auth.users
-- ─────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, usuario, full_name, email, role)
  values (
    new.id,
    -- usuario: del metadata, o la parte local del email sintético (<usuario>@acceso.ludimente.mx)
    coalesce(new.raw_user_meta_data->>'usuario', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'email_contacto',
    coalesce(new.raw_user_meta_data->>'role', 'recepcionista')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────
-- GENERADOR DE NÚMERO DE EXPEDIENTE  LDM-YYYY-####
--   Usa advisory lock por año para evitar duplicados en concurrencia.
--   No reutiliza números: toma el máximo existente del año + 1.
-- ─────────────────────────────────────────
create or replace function public.generar_numero_expediente()
returns text language plpgsql security definer set search_path = public as $$
declare
  v_anio    text := to_char(current_date, 'YYYY');
  v_lock    bigint := ('x' || substr(md5('expediente-' || v_anio), 1, 15))::bit(60)::bigint;
  v_max     int;
  v_next    int;
begin
  -- Bloqueo transaccional por año (se libera al commit)
  perform pg_advisory_xact_lock(v_lock);

  select coalesce(max(
    nullif(regexp_replace(numero_expediente, '^LDM-' || v_anio || '-', ''), numero_expediente)::int
  ), 0)
  into v_max
  from pacientes
  where numero_expediente like 'LDM-' || v_anio || '-%';

  v_next := v_max + 1;
  return 'LDM-' || v_anio || '-' || lpad(v_next::text, 4, '0');
end;
$$;

-- Asignar expediente automáticamente si no se proporcionó
create or replace function public.set_numero_expediente()
returns trigger language plpgsql as $$
begin
  if new.numero_expediente is null or new.numero_expediente = '' then
    new.numero_expediente := public.generar_numero_expediente();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_numero_expediente on pacientes;
create trigger trg_numero_expediente
  before insert on pacientes
  for each row execute function public.set_numero_expediente();

-- ─────────────────────────────────────────
-- Número de sesión automático por paciente
-- ─────────────────────────────────────────
create or replace function public.set_numero_sesion()
returns trigger language plpgsql as $$
begin
  if new.numero_sesion is null or new.numero_sesion = 0 then
    select coalesce(max(numero_sesion), 0) + 1
    into new.numero_sesion
    from sesiones
    where paciente_id = new.paciente_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_numero_sesion on sesiones;
create trigger trg_numero_sesion
  before insert on sesiones
  for each row execute function public.set_numero_sesion();

-- ─────────────────────────────────────────
-- AUDIT LOG automático (pacientes y sesiones)
-- ─────────────────────────────────────────
create or replace function public.fn_audit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_registro_id uuid;
begin
  v_registro_id := coalesce(new.id, old.id);
  insert into public.audit_log (tabla, registro_id, accion, usuario_id, datos_antes, datos_despues)
  values (
    tg_table_name,
    v_registro_id,
    tg_op,
    auth.uid(),
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['pacientes','sesiones'] loop
    execute format(
      'drop trigger if exists trg_audit on %I; '
      'create trigger trg_audit after insert or update or delete on %I '
      'for each row execute function public.fn_audit();', t, t);
  end loop;
end$$;
