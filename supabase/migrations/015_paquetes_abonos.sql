-- ════════════════════════════════════════════════════════════
-- LUDIMENTE — 015 Paquetes de sesiones y abonos parciales
--   • paquetes            : catálogo (nombre, num_sesiones, precio)
--   • paquetes_paciente   : paquete asignado a un paciente (con saldo)
--   • abonos              : pagos parciales hacia un paquete asignado
--   Todo es financiero → RLS solo admin (consistente con pagos).
-- ════════════════════════════════════════════════════════════

create table if not exists paquetes (
  id           uuid primary key default gen_random_uuid(),
  nombre       text not null,
  num_sesiones integer not null check (num_sesiones > 0),
  precio       numeric(10,2) not null check (precio >= 0),
  activo       boolean default true,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create table if not exists paquetes_paciente (
  id               uuid primary key default gen_random_uuid(),
  paciente_id      uuid not null references pacientes(id) on delete cascade,
  paquete_id       uuid references paquetes(id) on delete set null,
  nombre           text not null,
  sesiones_totales integer not null check (sesiones_totales > 0),
  sesiones_usadas  integer not null default 0 check (sesiones_usadas >= 0),
  precio_total     numeric(10,2) not null check (precio_total >= 0),
  fecha            date default current_date,
  notas            text,
  created_by       uuid references profiles(id),
  created_at       timestamptz default now()
);
create index if not exists idx_paqpac_paciente on paquetes_paciente(paciente_id);

create table if not exists abonos (
  id                   uuid primary key default gen_random_uuid(),
  paquete_paciente_id  uuid not null references paquetes_paciente(id) on delete cascade,
  monto                numeric(10,2) not null check (monto > 0),
  metodo_pago          text not null default 'efectivo' check (metodo_pago in (
                         'efectivo','transferencia','tarjeta_debito','tarjeta_credito','otro')),
  fecha                timestamptz default now(),
  referencia           text,
  created_by           uuid references profiles(id),
  created_at           timestamptz default now()
);
create index if not exists idx_abonos_paquete on abonos(paquete_paciente_id);

-- updated_at en paquetes
drop trigger if exists trg_updated_at on paquetes;
create trigger trg_updated_at before update on paquetes
  for each row execute function public.set_updated_at();

-- ── RLS: solo admin (financiero) ──
alter table paquetes           enable row level security;
alter table paquetes_paciente  enable row level security;
alter table abonos             enable row level security;

create policy paquetes_admin on paquetes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy paqpac_admin on paquetes_paciente
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy abonos_admin on abonos
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Auditoría
do $$
declare t text;
begin
  foreach t in array array['paquetes_paciente','abonos'] loop
    execute format(
      'drop trigger if exists trg_audit on %I; '
      'create trigger trg_audit after insert or update or delete on %I '
      'for each row execute function public.fn_audit();', t, t);
  end loop;
end$$;
