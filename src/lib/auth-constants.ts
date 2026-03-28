/** Nombre de la cookie de sesion (JWT). */
export const COOKIE_SESSION = "estudio_session";

/** Timeout de inactividad: 15 minutos sin uso. */
export const SESSION_MAX_AGE = 60 * 15;

/**
 * Cookie `Secure`: solo se envía por HTTPS. En producción con HTTP (p. ej. EC2 sin certificado),
 * el navegador ignora la cookie y la sesión no persiste al hacer clic o recargar.
 * En `.env`: `AUTH_COOKIE_SECURE=0` mientras accedas solo por http://
 * Con HTTPS (Certbot, etc.): no definas la variable o `AUTH_COOKIE_SECURE=1`.
 */
export function sessionCookieSecure(): boolean {
  const v = process.env.AUTH_COOKIE_SECURE?.trim().toLowerCase();
  if (v === "0" || v === "false" || v === "no") {
    return false;
  }
  if (v === "1" || v === "true" || v === "yes") {
    return true;
  }
  return process.env.NODE_ENV === "production";
}
