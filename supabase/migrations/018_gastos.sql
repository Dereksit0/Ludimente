-- ════════════════════════════════════════════════════════════
-- LUDIMENTE — 018 Gastos y finanzas
--   • gastos : egresos del consultorio (categoría, monto, método…)
--   Financiero → RLS solo admin (consistente con pagos/paquetes).
-- ════════════════════════════════════════════════════════════

create table if not exists gastos (
  id          uuid primary key default gen_random_uuid(),
  categoria   text not null default 'otro' check (categoria in (
                'renta','servicios','nomina','material','equipo',
                'marketing','impuestos','mantenimiento','otro')),
  concepto    text not null,
  monto       numeric(10,2) not null check (monto >= 0),
  fecha       date not null default current_date,
  metodo_pago text not null default 'efectivo' check (metodo_pago in (
                'efectivo','transferencia','tarjeta_debito','tarjeta_credito','otro')),
  proveedor   text,
  notas       text,
  created_by  uuid references profiles(id),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create index if not exists idx_gastos_fecha on gastos(fecha);

drop trigger if exists trg_updated_at on gastos;
create trigger trg_updated_at before update on gastos
  for each row execute function public.set_updated_at();

alter table gastos enable row level security;

create policy gastos_admin on gastos
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

do $$
begin
  execute 'drop trigger if exists trg_audit on gastos';
  execute 'create trigger trg_audit after insert or update or delete on gastos '
       || 'for each row execute function public.fn_audit()';
end$$;
