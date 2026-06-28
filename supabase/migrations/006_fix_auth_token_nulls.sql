-- ════════════════════════════════════════════════════════════
-- LUDIMENTE — 006 Corrección de NULLs en columnas de token de auth
--   GoTrue (Supabase Auth) falla con error 500 al iniciar sesión
--   cuando las columnas de token de auth.users están en NULL.
--   Esto ocurre al insertar usuarios manualmente (ver 004_seed_data).
--   Solución: poner cadena vacía '' donde haya NULL.
-- ════════════════════════════════════════════════════════════

update auth.users
set
  confirmation_token        = coalesce(confirmation_token, ''),
  recovery_token            = coalesce(recovery_token, ''),
  email_change              = coalesce(email_change, ''),
  email_change_token_new    = coalesce(email_change_token_new, ''),
  email_change_token_current = coalesce(email_change_token_current, ''),
  phone_change              = coalesce(phone_change, ''),
  phone_change_token        = coalesce(phone_change_token, ''),
  reauthentication_token    = coalesce(reauthentication_token, '')
where
  confirmation_token is null
  or recovery_token is null
  or email_change is null
  or email_change_token_new is null
  or email_change_token_current is null
  or phone_change is null
  or phone_change_token is null
  or reauthentication_token is null;
