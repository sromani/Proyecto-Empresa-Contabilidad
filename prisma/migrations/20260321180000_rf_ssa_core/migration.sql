-- RF SSA: tipos de persona, estado de asunto, tipo TODOS, roles de app ampliados,
-- asunto con ordinal/fechas/roles de responsables, cliente extendido, seguimiento con usuario, auditoria.

-- Nuevos enums
CREATE TYPE "TipoPersona" AS ENUM ('FISICA', 'JURIDICA');
CREATE TYPE "EstadoAsunto" AS ENUM ('EN_TRAMITE', 'FINALIZADO');

-- Ampliar enums existentes (RolApp: ver migracion siguiente; PG no permite usar nuevos valores en la misma transaccion)
ALTER TYPE "TipoAsunto" ADD VALUE 'TODOS';

-- Cliente
ALTER TABLE "Cliente" ADD COLUMN "tipoPersona" "TipoPersona" NOT NULL DEFAULT 'FISICA';
ALTER TABLE "Cliente" ADD COLUMN "telefono" TEXT;
ALTER TABLE "Cliente" ADD COLUMN "email" TEXT;
ALTER TABLE "Cliente" ADD COLUMN "domicilio" TEXT;
UPDATE "Cliente" SET "telefono" = "contacto" WHERE "telefono" IS NULL;
ALTER TABLE "Cliente" ALTER COLUMN "contacto" DROP NOT NULL;

-- Asunto: ordinal correlativo
ALTER TABLE "Asunto" ADD COLUMN "ordinal" INTEGER;
UPDATE "Asunto" AS a
SET "ordinal" = r.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt" ASC) AS rn
  FROM "Asunto"
) AS r
WHERE a.id = r.id;
CREATE SEQUENCE "Asunto_ordinal_seq";
-- setval(0) falla si no hay asuntos; sin filas el siguiente nextval debe ser 1.
SELECT CASE
  WHEN EXISTS (SELECT 1 FROM "Asunto" LIMIT 1) THEN
    setval('"Asunto_ordinal_seq"', (SELECT MAX("ordinal") FROM "Asunto"), true)
  ELSE
    setval('"Asunto_ordinal_seq"', 1, false)
END;
ALTER TABLE "Asunto" ALTER COLUMN "ordinal" SET DEFAULT nextval('"Asunto_ordinal_seq"');
ALTER SEQUENCE "Asunto_ordinal_seq" OWNED BY "Asunto"."ordinal";
ALTER TABLE "Asunto" ALTER COLUMN "ordinal" SET NOT NULL;
CREATE UNIQUE INDEX "Asunto_ordinal_key" ON "Asunto"("ordinal");

ALTER TABLE "Asunto" ADD COLUMN "descripcion" TEXT;
ALTER TABLE "Asunto" ADD COLUMN "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Asunto" ADD COLUMN "fechaFinalizacion" TIMESTAMP(3);
ALTER TABLE "Asunto" ADD COLUMN "fechaAlertaVencimiento" TIMESTAMP(3);
ALTER TABLE "Asunto" ADD COLUMN "ultimoMovimientoFecha" TIMESTAMP(3);
ALTER TABLE "Asunto" ADD COLUMN "ultimoMovimientoTexto" TEXT;

ALTER TABLE "Asunto" ADD COLUMN "profesionalACargoId" TEXT;
ALTER TABLE "Asunto" ADD COLUMN "colaboradorACargoId" TEXT;
ALTER TABLE "Asunto" ADD COLUMN "contadorReferenteId" TEXT;

-- Copiar primer profesional asignado como "a cargo"
UPDATE "Asunto" a
SET "profesionalACargoId" = ap."profesionalId"
FROM (
  SELECT DISTINCT ON ("asuntoId") "asuntoId", "profesionalId"
  FROM "AsuntoProfesional"
  ORDER BY "asuntoId", "createdAt" ASC
) ap
WHERE a.id = ap."asuntoId";

-- Si falta (sin filas en junction), asignar el primer profesional del maestro
UPDATE "Asunto"
SET "profesionalACargoId" = (SELECT id FROM "Profesional" ORDER BY "createdAt" ASC LIMIT 1)
WHERE "profesionalACargoId" IS NULL;

UPDATE "Asunto" a
SET "colaboradorACargoId" = sub."profesionalId"
FROM (
  SELECT "asuntoId", "profesionalId",
         ROW_NUMBER() OVER (PARTITION BY "asuntoId" ORDER BY "createdAt" ASC) AS rn
  FROM "AsuntoProfesional"
) sub
WHERE a.id = sub."asuntoId" AND sub.rn = 2;

UPDATE "Asunto" a
SET "contadorReferenteId" = sub."profesionalId"
FROM (
  SELECT "asuntoId", "profesionalId",
         ROW_NUMBER() OVER (PARTITION BY "asuntoId" ORDER BY "createdAt" ASC) AS rn
  FROM "AsuntoProfesional"
) sub
WHERE a.id = sub."asuntoId" AND sub.rn = 3;

ALTER TABLE "Asunto" ALTER COLUMN "profesionalACargoId" SET NOT NULL;

-- Reemplazar columna estado TEXT por enum
ALTER TABLE "Asunto" ADD COLUMN "estadoAsunto" "EstadoAsunto" NOT NULL DEFAULT 'EN_TRAMITE';
UPDATE "Asunto" SET "estadoAsunto" = 'EN_TRAMITE';
ALTER TABLE "Asunto" DROP COLUMN "estado";
ALTER TABLE "Asunto" RENAME COLUMN "estadoAsunto" TO "estado";

-- FKs nuevas en Asunto
ALTER TABLE "Asunto" ADD CONSTRAINT "Asunto_profesionalACargoId_fkey"
  FOREIGN KEY ("profesionalACargoId") REFERENCES "Profesional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Asunto" ADD CONSTRAINT "Asunto_colaboradorACargoId_fkey"
  FOREIGN KEY ("colaboradorACargoId") REFERENCES "Profesional"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Asunto" ADD CONSTRAINT "Asunto_contadorReferenteId_fkey"
  FOREIGN KEY ("contadorReferenteId") REFERENCES "Profesional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Quitar tabla de asignacion multiple (datos ya copiados a FKs)
DROP TABLE "AsuntoProfesional";

-- Ultimo movimiento desde seguimientos
UPDATE "Asunto" a
SET
  "ultimoMovimientoFecha" = s.fecha,
  "ultimoMovimientoTexto" = LEFT(s.descripcion, 500)
FROM (
  SELECT DISTINCT ON ("asuntoId") "asuntoId", fecha, descripcion
  FROM "Seguimiento"
  ORDER BY "asuntoId", fecha DESC, "createdAt" DESC
) s
WHERE a.id = s."asuntoId";

-- Seguimiento: usuario que registra
ALTER TABLE "Seguimiento" ADD COLUMN "usuarioId" TEXT;
ALTER TABLE "Seguimiento" ADD CONSTRAINT "Seguimiento_usuarioId_fkey"
  FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Auditoria
CREATE TABLE "AuditoriaLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT,
    "detalle" JSONB,

    CONSTRAINT "AuditoriaLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AuditoriaLog" ADD CONSTRAINT "AuditoriaLog_usuarioId_fkey"
  FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "AuditoriaLog_createdAt_idx" ON "AuditoriaLog"("createdAt");
CREATE INDEX "AuditoriaLog_entidad_entidadId_idx" ON "AuditoriaLog"("entidad", "entidadId");
