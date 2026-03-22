import { Prisma } from "@/generated/prisma";

export function obtenerErrorConfiguracionDb(): string | null {
  if (!process.env.DATABASE_URL) {
    return "Falta configurar DATABASE_URL en el archivo .env.";
  }
  return null;
}

function mensajePorCodigoPrisma(code: string, message: string): string | null {
  switch (code) {
    case "P1001":
      return "No se puede conectar a PostgreSQL. Revisa DATABASE_URL (puerto = el de la izquierda en docker ps; en este repo suele ser 5433). En Windows conviene 127.0.0.1.";
    case "P1003":
      return "La base de datos de DATABASE_URL no existe. Crea la base (por ejemplo estudio_uy) o corrige el nombre en la URL.";
    case "P1017":
      return "PostgreSQL cerro la conexion. Reinicia el servicio de base de datos y vuelve a intentar.";
    case "P2002":
      return null;
    case "P2003":
      return "Violacion de clave foranea: algun dato relacionado no existe en la base.";
    case "P2011":
      return "Violacion de NOT NULL en la base: faltan datos obligatorios o la tabla no coincide con el modelo. Ejecuta: npx prisma migrate dev";
    case "P2021":
      return "Falta una tabla en la base (modelo mas nuevo que la BD). Ejecuta en la carpeta del proyecto: npx prisma migrate dev";
    case "P2022":
      return "La base esta desactualizada (faltan columnas). Ejecuta: npx prisma migrate dev";
    default:
      return `Error en la base (${code}). ${message.split("\n")[0] ?? message} — Si acabas de actualizar el codigo, ejecuta: npx prisma migrate dev`;
  }
}

/**
 * Mensajes claros para errores de Prisma (conexion, migraciones, etc.).
 * Para errores conocidos con codigo pero sin texto amistoso, devuelve el detalle de Prisma.
 */
export function mensajeErrorPrismaParaUsuario(error: unknown): string | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return null;
    return mensajePorCodigoPrisma(error.code, error.message);
  }
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = String((error as { code?: string }).code);
    const msg =
      error instanceof Error
        ? error.message
        : typeof (error as { message?: string }).message === "string"
          ? (error as { message: string }).message
          : "";
    if (code === "P2002") return null;
    return mensajePorCodigoPrisma(code, msg);
  }
  return null;
}

/** Errores de validacion del cliente Prisma (argumentos invalidos). */
export function esPrismaValidacion(error: unknown): error is Prisma.PrismaClientValidationError {
  return error instanceof Prisma.PrismaClientValidationError;
}

/** Texto seguro para mostrar en desarrollo si el error no es Prisma conocido. */
export function mensajeErrorDesarrollo(error: unknown): string | null {
  if (process.env.NODE_ENV !== "development") return null;
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  return String(error);
}
