"use client";

import { useState } from "react";

import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { Toaster } from "sonner";

/** Providers globales: React Query + Toaster con estilo Ludimente. */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        // Un solo lugar para avisar al usuario cuando una consulta falla.
        queryCache: new QueryCache({
          onError: () => {
            toast.error("No pudimos cargar la información. Revisa tu conexión.");
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: "var(--font-nunito)",
            borderRadius: "0.875rem",
          },
        }}
      />
    </QueryClientProvider>
  );
}
