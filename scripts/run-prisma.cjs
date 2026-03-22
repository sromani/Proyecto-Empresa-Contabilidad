/**
 * Ejecuta el CLI de Prisma con DATABASE_URL ya normalizada (puerto Docker / localhost).
 * Uso: node scripts/run-prisma.cjs migrate dev
 */
const path = require("path");
const { spawnSync } = require("child_process");

require(path.join(__dirname, "prisma-normalize-env.cjs"));

const raiz = path.join(__dirname, "..");
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Uso: node scripts/run-prisma.cjs <comando prisma...>  ej: migrate dev");
  process.exit(1);
}

const r = spawnSync("npx", ["prisma", ...args], {
  cwd: raiz,
  stdio: "inherit",
  env: process.env,
  shell: true,
});

process.exit(r.status === null ? 1 : r.status);
