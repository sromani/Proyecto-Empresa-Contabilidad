/**
 * Limpia artefactos de compilacion de Next.js que suelen corromperse en Windows
 * (varios dev servers, antivirus, OneDrive en Escritorio, etc.).
 *
 * Errores tipicos:
 * - Cannot find module './638.js'
 * - ENOENT vendor-chunks/next.js
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

const rutas = [path.join(root, ".next"), path.join(root, "node_modules", ".cache")];

for (const dir of rutas) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log("Eliminado:", path.relative(root, dir));
  }
}

console.log("Limpieza lista. Ejecuta: npm run dev");
