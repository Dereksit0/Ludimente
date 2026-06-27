/**
 * Login por ID (usuario), no por correo.
 *
 * Supabase Auth requiere un email para autenticar con contraseña, así que
 * mapeamos cada ID de usuario a un email sintético interno bajo un dominio
 * no enrutable que nunca recibe correo. El equipo solo ve y escribe el ID.
 */
export const DOMINIO_ACCESO = "acceso.ludimente.mx";

/** Normaliza el ID: minúsculas y sin espacios alrededor. */
export function normalizarUsuario(usuario: string): string {
  return usuario.trim().toLowerCase();
}

/** Convierte un ID de usuario en el email sintético usado por Supabase Auth. */
export function usuarioAEmail(usuario: string): string {
  return `${normalizarUsuario(usuario)}@${DOMINIO_ACCESO}`;
}
