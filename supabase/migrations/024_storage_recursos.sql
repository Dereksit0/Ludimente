-- ════════════════════════════════════════════════════════════
-- LUDIMENTE — 024 Bucket de Storage para la Biblioteca
--   Bucket público "recursos": archivos adjuntos de la biblioteca
--   (PDFs, fichas, imágenes). Lectura pública; gestión por staff.
-- ════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public)
values ('recursos', 'recursos', true)
on conflict (id) do nothing;

drop policy if exists recursos_insert on storage.objects;
drop policy if exists recursos_update on storage.objects;
drop policy if exists recursos_delete on storage.objects;
drop policy if exists recursos_select on storage.objects;

create policy recursos_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'recursos');
create policy recursos_update on storage.objects
  for update to authenticated using (bucket_id = 'recursos');
create policy recursos_delete on storage.objects
  for delete to authenticated using (bucket_id = 'recursos');
create policy recursos_select on storage.objects
  for select to public using (bucket_id = 'recursos');
