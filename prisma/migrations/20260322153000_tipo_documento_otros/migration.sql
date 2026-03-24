-- AlterEnum: agrega OTROS para documentos de sociedades/extranjeros.
ALTER TYPE "TipoDocumento" ADD VALUE IF NOT EXISTS 'OTROS';
