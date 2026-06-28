"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { Rol } from "@/types/database.types";

/** Rol del usuario actual, leído del token (app_metadata). */
export function useRolActual() {
  return useQuery({
    queryKey: ["rol-actual"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Rol | null> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return ((user?.app_metadata?.role as Rol) ?? null) || null;
    },
  });
}
