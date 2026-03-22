/**
 * Regenera Prisma Client con motor local (postgresql://).
 * El cliente se genera en src/generated/prisma (no en node_modules/.prisma),
 * asi se evita el cliente roto por `prisma generate --no-engine` y EPERM en Windows.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.join(__dirname, "..");
const generado = path.join(root, "src", "generated", "prisma");
const prismaClientLegacy = path.join(root, "node_modules", ".prisma", "client");

for (const dir of [generado, prismaClientLegacy]) {
  if (fs.existsSync(dir)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log("Eliminado:", path.relative(root, dir));
    } catch (err) {
      console.warn("No se pudo borrar por completo:", path.relative(root, dir), err.message);
    }
  }
}

execSync("npx prisma generate", { stdio: "inherit", cwd: root, env: process.env });
