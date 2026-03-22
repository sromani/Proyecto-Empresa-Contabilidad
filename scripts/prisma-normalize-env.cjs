/**
 * Ajusta process.env.DATABASE_URL antes de crear PrismaClient en scripts Node (seed, etc.).
 * Misma regla que src/lib/database-url.ts: Windows localhost -> 127.0.0.1;
 * fuera de produccion, local :5432 -> :5433 (docker-compose del repo).
 *
 * Uso: require() al inicio del script, antes de new PrismaClient().
 */
const fs = require("fs");
const path = require("path");

function cargarDatabaseUrlDesdeDotEnv() {
  if (process.env.DATABASE_URL) return;
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return;
  let raw = fs.readFileSync(envPath, "utf8");
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    if (t.slice(0, eq).trim() !== "DATABASE_URL") continue;
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (val) process.env.DATABASE_URL = val;
    return;
  }
}

function normalizar(url) {
  if (!url || !String(url).trim()) return url;
  try {
    const p = new URL(url);
    if (process.platform === "win32" && p.hostname === "localhost") {
      p.hostname = "127.0.0.1";
    }
    const esLocal = p.hostname === "127.0.0.1" || p.hostname === "localhost";
    const puerto = p.port || "5432";
    const noProd = process.env.NODE_ENV !== "production";
    if (
      noProd &&
      process.env.DATABASE_URL_USE_LOCAL_PG_5432 !== "1" &&
      esLocal &&
      puerto === "5432"
    ) {
      p.port = "5433";
    }
    return p.toString();
  } catch {
    return url;
  }
}

cargarDatabaseUrlDesdeDotEnv();
if (process.env.DATABASE_URL) {
  const antes = process.env.DATABASE_URL;
  const despues = normalizar(antes);
  if (despues !== antes) {
    process.env.DATABASE_URL = despues;
  }
}
