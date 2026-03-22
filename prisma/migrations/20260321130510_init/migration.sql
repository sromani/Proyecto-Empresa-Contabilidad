-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('RUT', 'CI');

-- CreateEnum
CREATE TYPE "TipoAsunto" AS ENUM ('NOTARIAL', 'LEGAL');

-- CreateEnum
CREATE TYPE "RolProfesional" AS ENUM ('SOCIO', 'ESCRIBANO', 'ABOGADO', 'PROCURADOR');

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "tipoDocumento" "TipoDocumento" NOT NULL,
    "documento" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "contacto" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AsuntoCatalogo" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AsuntoCatalogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profesional" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "profesion" TEXT NOT NULL,
    "funcion" TEXT NOT NULL,
    "rol" "RolProfesional" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profesional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Socio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Socio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asunto" (
    "id" TEXT NOT NULL,
    "tipo" "TipoAsunto" NOT NULL,
    "clienteId" TEXT NOT NULL,
    "catalogoId" TEXT NOT NULL,
    "socioReferenteId" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ABIERTO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asunto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AsuntoProfesional" (
    "id" TEXT NOT NULL,
    "asuntoId" TEXT NOT NULL,
    "profesionalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AsuntoProfesional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Seguimiento" (
    "id" TEXT NOT NULL,
    "asuntoId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descripcion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Seguimiento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_documento_key" ON "Cliente"("documento");

-- CreateIndex
CREATE UNIQUE INDEX "AsuntoCatalogo_nombre_key" ON "AsuntoCatalogo"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "AsuntoProfesional_asuntoId_profesionalId_key" ON "AsuntoProfesional"("asuntoId", "profesionalId");

-- AddForeignKey
ALTER TABLE "Asunto" ADD CONSTRAINT "Asunto_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asunto" ADD CONSTRAINT "Asunto_catalogoId_fkey" FOREIGN KEY ("catalogoId") REFERENCES "AsuntoCatalogo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asunto" ADD CONSTRAINT "Asunto_socioReferenteId_fkey" FOREIGN KEY ("socioReferenteId") REFERENCES "Socio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsuntoProfesional" ADD CONSTRAINT "AsuntoProfesional_asuntoId_fkey" FOREIGN KEY ("asuntoId") REFERENCES "Asunto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsuntoProfesional" ADD CONSTRAINT "AsuntoProfesional_profesionalId_fkey" FOREIGN KEY ("profesionalId") REFERENCES "Profesional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seguimiento" ADD CONSTRAINT "Seguimiento_asuntoId_fkey" FOREIGN KEY ("asuntoId") REFERENCES "Asunto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
