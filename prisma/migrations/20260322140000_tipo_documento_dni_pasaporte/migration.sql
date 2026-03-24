-- AlterEnum: DNI y PASAPORTE para clientes (ademas de RUT y CI).
ALTER TYPE "TipoDocumento" ADD VALUE IF NOT EXISTS 'DNI';
ALTER TYPE "TipoDocumento" ADD VALUE IF NOT EXISTS 'PASAPORTE';
