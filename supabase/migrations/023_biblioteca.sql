-- ════════════════════════════════════════════════════════════
-- LUDIMENTE — 023 Biblioteca de recursos y actividades
--   • recursos : actividades, lecturas, juegos y enlaces que el equipo
--     usa o comparte con las familias, con etiquetas y rango de edad.
--   Recurso interno → cualquier miembro autenticado.
-- ════════════════════════════════════════════════════════════

create table if not exists recursos (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null,
  descripcion text,
  categoria   text not null default 'actividad' check (categoria in (
                'actividad','lectura','juego','video','documento','enlace','ejercicio')),
  url         text,
  contenido   text,
  etiquetas   text[] not null default '{}',
  edad_min    integer,
  edad_max    integer,
  created_by  uuid references profiles(id),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create index if not exists idx_recursos_categoria on recursos(categoria);

drop trigger if exists trg_updated_at on recursos;
create trigger trg_updated_at before update on recursos
  for each row execute function public.set_updated_at();

alter table recursos enable row level security;

create policy recursos_staff on recursos
  for all to authenticated using (true) with check (true);

do $$
begin
  execute 'drop trigger if exists trg_audit on recursos';
  execute 'create trigger trg_audit after insert or update or delete on recursos '
       || 'for each row execute function public.fn_audit()';
end$$;
