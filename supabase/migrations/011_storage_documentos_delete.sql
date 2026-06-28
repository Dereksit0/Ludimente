-- ════════════════════════════════════════════════════════════
-- LUDIMENTE — 011 Permitir borrar/actualizar objetos en Storage
--   Las políticas previas (005) solo cubrían SELECT e INSERT.
--   Para que el equipo pueda eliminar documentos y reemplazar fotos
--   se necesitan políticas de DELETE y UPDATE en storage.objects.
-- ════════════════════════════════════════════════════════════

do $$
begin
  drop policy if exists "equipo borra documentos" on storage.objects;
  drop policy if exists "equipo actualiza documentos" on storage.objects;
  drop policy if exists "equipo borra fotos" on storage.objects;
  drop policy if exists "equipo actualiza fotos" on storage.objects;
end$$;

create policy "equipo borra documentos" on storage.objects
  for delete to authenticated using (bucket_id = 'documentos');
create policy "equipo actualiza documentos" on storage.objects
  for update to authenticated using (bucket_id = 'documentos');

create policy "equipo borra fotos" on storage.objects
  for delete to authenticated using (bucket_id = 'pacientes-fotos');
create policy "equipo actualiza fotos" on storage.objects
  for update to authenticated using (bucket_id = 'pacientes-fotos');
