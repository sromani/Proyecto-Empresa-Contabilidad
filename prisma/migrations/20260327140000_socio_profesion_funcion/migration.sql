-- Campos opcionales alineados con equipo (nombre + datos extra comunes)
ALTER TABLE "Socio" ADD COLUMN IF NOT EXISTS "profesion" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Socio" ADD COLUMN IF NOT EXISTS "funcion" TEXT NOT NULL DEFAULT '';
