import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

/**
 * Cliente de Supabase con service role. SOLO para servidor.
 * Salta RLS, así que jamás debe exponerse al cliente ni usarse con datos
 * provenientes del usuario sin validar. Úsalo para tareas administrativas
 * puntuales (p. ej. listar el equipo en la pantalla de login).
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
