-- ════════════════════════════════════════════════════════════
-- LUDIMENTE — 016 Notificaciones in-app + solicitudes de cita (portal)
-- ════════════════════════════════════════════════════════════

create table if not exists solicitudes_cita (
  id             uuid primary key default gen_random_uuid(),
  paciente_id    uuid not null references pacientes(id) on delete cascade,
  tutor_id       uuid references tutores(id) on delete set null,
  fecha_preferida date,
  nota           text,
  estatus        text not null default 'pendiente'
                   check (estatus in ('pendiente','atendida','rechazada')),
  created_at     timestamptz default now()
);
create index if not exists idx_solicitudes_estatus on solicitudes_cita(estatus);

create table if not exists notificaciones (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles(id) on delete cascade, -- destinatario específico
  rol        text,                                           -- o destinatario por rol
  titulo     text not null,
  mensaje    text,
  tipo       text default 'info',
  enlace     text,
  leida      boolean default false,
  created_at timestamptz default now()
);
create index if not exists idx_notif_destino on notificaciones(user_id, rol, leida);

alter table solicitudes_cita enable row level security;
alter table notificaciones   enable row level security;

-- Solicitudes: el equipo clínico/recepción las ve y atiende.
create policy solicitudes_staff on solicitudes_cita
  for all to authenticated
  using (public.is_admin() or public.auth_role() in ('psicologo','recepcionista'))
  with check (public.is_admin() or public.auth_role() in ('psicologo','recepcionista'));

-- Notificaciones: cada quien ve las suyas (por usuario o por rol).
create policy notif_lee on notificaciones
  for select to authenticated
  using (user_id = auth.uid() or (rol is not null and rol = public.auth_role()));

create policy notif_marca on notificaciones
  for update to authenticated
  using (user_id = auth.uid() or (rol is not null and rol = public.auth_role()))
  with check (user_id = auth.uid() or (rol is not null and rol = public.auth_role()));
