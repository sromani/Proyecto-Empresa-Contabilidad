/**
 * Diagnostico de conexion a PostgreSQL (lee .env del proyecto, prueba Docker y Prisma).
 * Uso: npm run db:diagnostico
 */
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const raiz = path.join(__dirname, "..");

function cargarDatabaseUrlDesdeEnvFile() {
  const envPath = path.join(raiz, ".env");
  if (!fs.existsSync(envPath)) {
    return { url: null, error: `No existe ${envPath}. Copia .env.example a .env y configura DATABASE_URL.` };
  }
  let raw = fs.readFileSync(envPath, "utf8");
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    if (key !== "DATABASE_URL") continue;
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!val) return { url: null, error: "DATABASE_URL esta vacia en .env" };
    return { url: val, error: null };
  }
  return { url: null, error: "No se encontro DATABASE_URL en .env" };
}

function enmascararUrl(u) {
  try {
    const parsed = new URL(u);
    if (parsed.password) parsed.password = "***";
    return parsed.toString();
  } catch {
    return "(URL invalida)";
  }
}

/** Misma logica que src/lib/database-url.ts (localhost + 5432->5433 en dev). */
function normalizarUrlComoApp(url) {
  if (!url || !String(url).trim()) return url;
  try {
    const p = new URL(url);
    if (process.platform === "win32" && p.hostname === "localhost") {
      p.hostname = "127.0.0.1";
    }
    const esLocal = p.hostname === "127.0.0.1" || p.hostname === "localhost";
    const puerto = p.port || "5432";
    const enDev = process.env.NODE_ENV !== "production";
    if (
      enDev &&
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

function dockerPs() {
  const r = spawnSync("docker", ["ps", "--format", "{{.Names}}\t{{.Status}}\t{{.Ports}}"], {
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  if (r.error) {
    return `No se pudo ejecutar docker: ${r.error.message}\n¿Tenés Docker Desktop abierto?`;
  }
  if (r.status !== 0) {
    return `docker ps fallo (codigo ${r.status}). Salida: ${r.stderr || r.stdout || "(vacío)"}`;
  }
  const out = (r.stdout || "").trim();
  return out || "(ningun contenedor corriendo)";
}

async function probarPrisma(urlOriginal) {
  const urlWin = normalizarUrlComoApp(urlOriginal);
  let PrismaClient;
  try {
    PrismaClient = require(path.join(raiz, "src", "generated", "prisma")).PrismaClient;
  } catch (e) {
    return {
      ok: false,
      msg: `No se pudo cargar Prisma Client (${e.message}). Ejecuta: npx prisma generate`,
    };
  }
  const prisma = new PrismaClient({
    datasources: { db: { url: urlWin } },
    log: ["error"],
  });
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, msg: `Conexion OK usando: ${enmascararUrl(urlWin)}` };
  } catch (e) {
    let extra = "";
    if (process.platform === "win32" && urlOriginal.includes("localhost") && !urlOriginal.includes("127.0.0.1")) {
      extra =
        "\n  Ya se probo sustituir localhost por 127.0.0.1 (como hace la app). Si sigue fallando, revisa puerto y credenciales.";
    }
    return {
      ok: false,
      msg: `${e.message || e}${extra}\n  URL probada (enmascarada): ${enmascararUrl(urlWin)}`,
    };
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

async function main() {
  console.log("=== Diagnostico PostgreSQL ===\n");

  const fromEnv = process.env.DATABASE_URL;
  const fromFile = cargarDatabaseUrlDesdeEnvFile();

  if (fromEnv) {
    console.log("DATABASE_URL viene del entorno del proceso (enmascarada):", enmascararUrl(fromEnv));
  }
  if (fromFile.url) {
    console.log("DATABASE_URL en archivo .env (enmascarada):", enmascararUrl(fromFile.url));
  } else {
    console.log("Archivo .env:", fromFile.error);
  }

  const url = fromEnv || fromFile.url;
  if (!url) {
    console.log("\nCorregi .env y volve a ejecutar: npm run db:diagnostico");
    process.exit(1);
  }

  console.log("\n--- Contenedores Docker ---");
  const psOut = dockerPs();
  console.log(psOut);
  const parecePostgresDocker = /->5432\/tcp/.test(psOut);
  if (!parecePostgresDocker) {
    console.log(
      "\n>>> No hay ningun contenedor exponiendo Postgres (no aparece ->5432/tcp en docker ps).",
    );
    console.log(">>> En la carpeta del proyecto ejecuta:  npm run db:up");
    console.log(">>> Si falla, revisa:  npm run db:logs");
  }
  console.log(
    "\nCon el docker-compose de este repo deberias ver: 0.0.0.0:5433->5432/tcp (host 5433 -> Postgres interno 5432).",
  );

  console.log("\n--- Prueba Prisma ---");
  const r = await probarPrisma(url);
  console.log(r.ok ? r.msg : "FALLO: " + r.msg);

  if (!r.ok) {
    console.log(`
--- Checklist ---
1. Docker Desktop: encendido.
2. En la carpeta del repo: npm run db:up    luego: npm run db:diagnostico
3. Puerto en DATABASE_URL = puerto de la IZQUIERDA en docker ps (este repo: **5433**).
4. Usuario / clave / BD = POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB del contenedor.
5. Si el contenedor no arranca: npm run db:logs
6. Clave con caracteres raros: entre comillas en .env o URL-encode en DATABASE_URL.
`);
    process.exit(1);
  }

  console.log("\nListo: la base responde. Reinicia npm run dev si la app seguia con error.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
