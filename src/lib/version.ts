/**
 * Versión de la aplicación (semver). Fuente única: `package.json` → campo `version`.
 * Al publicar cambios, actualizar allí (p. ej. 1.0.1 parche, 1.1.0 funcional, 2.0.0 ruptura).
 */
import packageJson from "../../package.json";

export const APP_VERSION = packageJson.version;
