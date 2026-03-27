-- CreateEnum
CREATE TYPE "GrupoProfesional" AS ENUM ('DIRECCION', 'LEGAL_A_CARGO', 'LEGAL_COLABORADOR', 'CONTADOR');

-- CreateEnum
CREATE TYPE "PuestoProfesional" AS ENUM ('DIRECTOR', 'GERENTE', 'ESCRIBANO', 'ABOGADO', 'PROCURADOR', 'ESTUDIANTE', 'ADMINISTRATIVO', 'CONTADOR');

-- AlterTable
ALTER TABLE "Profesional" ADD COLUMN "grupo" "GrupoProfesional";
ALTER TABLE "Profesional" ADD COLUMN "puesto" "PuestoProfesional";

UPDATE "Profesional" SET
  "grupo" = CASE
    WHEN "rol"::text = 'CONTADOR' THEN 'CONTADOR'::"GrupoProfesional"
    WHEN "rol"::text = 'PROCURADOR' THEN 'LEGAL_COLABORADOR'::"GrupoProfesional"
    ELSE 'LEGAL_A_CARGO'::"GrupoProfesional"
  END,
  "puesto" = CASE
    WHEN "rol"::text = 'CONTADOR' THEN 'CONTADOR'::"PuestoProfesional"
    WHEN "rol"::text = 'PROCURADOR' THEN 'PROCURADOR'::"PuestoProfesional"
    WHEN "rol"::text = 'ESCRIBANO' THEN 'ESCRIBANO'::"PuestoProfesional"
    WHEN "rol"::text = 'ABOGADO' THEN 'ABOGADO'::"PuestoProfesional"
    WHEN "rol"::text = 'SOCIO' THEN 'ABOGADO'::"PuestoProfesional"
    ELSE 'ABOGADO'::"PuestoProfesional"
  END;

ALTER TABLE "Profesional" ALTER COLUMN "grupo" SET NOT NULL;
ALTER TABLE "Profesional" ALTER COLUMN "puesto" SET NOT NULL;

ALTER TABLE "Profesional" DROP COLUMN "rol";

DROP TYPE "RolProfesional";

ALTER TABLE "Profesional" ALTER COLUMN "profesion" SET DEFAULT '';
