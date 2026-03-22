-- RF-08: default de rol para usuarios nuevos (valores RolApp ya confirmados en migracion anterior).
ALTER TABLE "Usuario" ALTER COLUMN "rol" SET DEFAULT 'PROFESIONAL'::"RolApp";
