-- ════════════════════════════════════════════════════════════
-- LUDIMENTE — 022 Inventario de materiales y tests
--   • inventario_items : materiales, pruebas, juegos y libros del
--     consultorio, con cantidad, ubicación, estado y préstamo simple.
--   Herramienta operativa interna → cualquier miembro autenticado.
-- ════════════════════════════════════════════════════════════

create table if not exists inventario_items (
  id             uuid primary key default gen_random_uuid(),
  nombre         text not null,
  categoria      text not null default 'material' check (categoria in (
                   'material','test','juego','libro','mobiliario','otro')),
  cantidad       integer not null default 1 check (cantidad >= 0),
  ubicacion      text,
  estado         text not null default 'disponible' check (estado in (
                   'disponible','prestado','agotado','mantenimiento')),
  prestado_a     text,
  fecha_prestamo date,
  notas          text,
  created_by     uuid references profiles(id),
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
create index if not exists idx_inventario_categoria on inventario_items(categoria);

drop trigger if exists trg_updated_at on inventario_items;
create trigger trg_updated_at before update on inventario_items
  for each row execute function public.set_updated_at();

alter table inventario_items enable row level security;

create policy inventario_staff on inventario_items
  for all to authenticated using (true) with check (true);

do $$
begin
  execute 'drop trigger if exists trg_audit on inventario_items';
  execute 'create trigger trg_audit after insert or update or delete on inventario_items '
       || 'for each row execute function public.fn_audit()';
end$$;
