/**
 * Ajustes para que Prisma conecte bien en desarrollo local (Windows + Docker).
 *
 * 1) `localhost` → `127.0.0.1` (evita IPv6 / P1001 con Docker Desktop).
 * 2) Fuera de produccion, si la URL usa puerto 5432 en local, se usa 5433:
 *    el docker-compose del repo mapea 5433 (host) -> 5432 (contenedor).
 *    Desactivar: DATABASE_URL_USE_LOCAL_PG_5432=1 (Postgres nativo en 5432).
 */
export function normalizarDatabaseUrlParaApp(url: string): string {
  if (!url.trim()) {
    return url;
  }
  try {
    const parsed = new URL(url);
    if (process.platform === "win32" && parsed.hostname === "localhost") {
      parsed.hostname = "127.0.0.1";
    }
    const esLocal =
      parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost";
    const puerto = parsed.port || "5432";
    const noProduccion = process.env.NODE_ENV !== "production";
    const sinOptOut = process.env.DATABASE_URL_USE_LOCAL_PG_5432 !== "1";
    if (noProduccion && sinOptOut && esLocal && puerto === "5432") {
      parsed.port = "5433";
    }
    return parsed.toString();
  } catch {
    return url;
  }
}
