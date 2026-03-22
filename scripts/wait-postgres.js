/**
 * Espera a que Postgres en Docker responda (pg_isready).
 * Uso: node scripts/wait-postgres.js
 */
const { spawnSync } = require("node:child_process");
const { setTimeout: sleep } = require("node:timers/promises");

const maxIntentos = 40;
const intervaloMs = 1000;

async function main() {
  for (let i = 0; i < maxIntentos; i++) {
    const r = spawnSync(
      "docker",
      ["compose", "exec", "-T", "db", "pg_isready", "-U", "postgres", "-d", "estudio_uy"],
      { stdio: "ignore" },
    );
    if (r.status === 0) {
      process.stdout.write("PostgreSQL listo.\n");
      return;
    }
    if (i === 0) {
      process.stdout.write("Esperando a PostgreSQL (Docker)...\n");
    }
    await sleep(intervaloMs);
  }
  process.stderr.write(
    "Timeout: no respondio Postgres. Ejecuta `docker compose ps` y revisa que el servicio `db` este Up (healthy).\n",
  );
  process.exit(1);
}

main().catch((e) => {
  process.stderr.write(String(e) + "\n");
  process.exit(1);
});
