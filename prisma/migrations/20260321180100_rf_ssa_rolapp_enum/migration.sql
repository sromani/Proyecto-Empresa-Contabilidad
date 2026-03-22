-- Valores nuevos de RolApp en transaccion propia (requerido por PostgreSQL antes de usarlos en DEFAULT).
ALTER TYPE "RolApp" ADD VALUE 'SOCIO';
ALTER TYPE "RolApp" ADD VALUE 'PROFESIONAL';
ALTER TYPE "RolApp" ADD VALUE 'COLABORADOR';
ALTER TYPE "RolApp" ADD VALUE 'CONTADOR';
ALTER TYPE "RolApp" ADD VALUE 'SOLO_LECTURA';
